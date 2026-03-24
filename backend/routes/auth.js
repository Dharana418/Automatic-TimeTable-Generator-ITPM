
import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import pool from '../config/db.js';
import {
    registerValidation,
    loginValidation,
    adminCreateUserValidation,
    bootstrapAdminValidation,
    adminRoleAssignmentCreateValidation,
    adminRoleAssignmentUpdateValidation,
    historyIdValidation,
    validate,
} from '../middlewares/validation.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';
import { decryptHistoryPassword, encryptHistoryPassword } from '../utils/historyPasswordCrypto.js';

const router = express.Router();

const ROLE_MAP = {
    admin: 'Admin',
    user: 'User',
    facultycoordinator: 'Faculty Coordinator',
    academiccoordinator: 'Academic Coordinator',
    lic: 'LIC',
    instructor: 'Instructor',
    professor: 'Professor',
    lecturer: 'Lecturer',
    assistantlecturer: 'Assistant Lecturer',
    seniorlecturer: 'Senior Lecturer',
    lecturerseniorlecturer: 'Lecturer/Senior Lecturer',
};

const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const parseRole = (value) => {
    const key = normalizeRoleKey(value);
    const storedRole = ROLE_MAP[key] || null;
    return { key, storedRole };
};

const createUserRecord = async ({
    name,
    email,
    password,
    address = null,
    birthday = null,
    phonenumber = null,
    role,
    roleAssignedBy = null,
    roleAssignmentNote = null,
}) => {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = await pool.query(
        `INSERT INTO users (name, email, password, address, birthday, phonenumber, role, role_assigned_by, role_assigned_at, role_assignment_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
         RETURNING *`,
        [name, email, hashedPassword, address, birthday, phonenumber, role, roleAssignedBy, roleAssignmentNote]
    );
    return newUser.rows[0];
};

const logRoleAssignmentHistory = async ({
    targetUserId,
    assignedRole,
    assignedBy = null,
    assignmentNote = null,
    plainPassword = null,
}) => {
    let passwordHash = null;
    let encryptedPassword = null;
    let encryptionIv = null;
    let encryptionTag = null;

    if (plainPassword) {
        passwordHash = await bcryptjs.hash(String(plainPassword), 10);
        const encrypted = encryptHistoryPassword(String(plainPassword));
        encryptedPassword = encrypted.encryptedPassword;
        encryptionIv = encrypted.iv;
        encryptionTag = encrypted.authTag;
    }

    await pool.query(
        `INSERT INTO role_assignment_history (
            target_user_id,
            assigned_role,
            assigned_by,
            assignment_note,
            password_hash,
            password_encrypted,
            password_encryption_iv,
            password_encryption_tag
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            targetUserId,
            assignedRole,
            assignedBy,
            assignmentNote,
            passwordHash,
            encryptedPassword,
            encryptionIv,
            encryptionTag,
        ]
    );
};

const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}
router.post('/register', registerValidation, validate, async (req, res) => {
    const { name, email, password, address, birthday, phonenumber } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const user = await createUserRecord({
            name,
            email,
            password,
            address,
            birthday,
            phonenumber,
            role: 'User',
        });
        const token = generateToken(user);
        res.cookie('token', token, cookieOptions);
        res.status(201).json({ user, token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', loginValidation, validate, async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcryptjs.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.rows[0]);
        res.cookie('token', token, cookieOptions);
        res.json({ user: user.rows[0], token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
});

router.post('/bootstrap-admin', bootstrapAdminValidation, validate, async (req, res) => {
    const setupKey = req.header('x-admin-setup-key');
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
        return res.status(403).json({ error: 'Invalid admin setup key' });
    }

    const { name, email, password, address, birthday, phonenumber, role = 'Admin', roleAssignmentNote } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const { key: roleKey, storedRole } = parseRole(role);
    if (!storedRole || roleKey !== 'admin') {
        return res.status(400).json({ error: 'bootstrap-admin only supports Admin role' });
    }

    try {
        const existingAdmin = await pool.query(
            `SELECT id FROM users WHERE lower(regexp_replace(role, '[^a-zA-Z0-9]', '', 'g')) = 'admin' LIMIT 1`
        );
        if (existingAdmin.rows.length > 0) {
            return res.status(409).json({ error: 'An admin user already exists. Use /api/auth/admin/users instead.' });
        }

        const user = await createUserRecord({
            name,
            email,
            password,
            address,
            birthday,
            phonenumber,
            role: storedRole,
            roleAssignedBy: null,
            roleAssignmentNote: roleAssignmentNote || 'Initial admin bootstrapped by setup key',
        });

        await logRoleAssignmentHistory({
            targetUserId: user.id,
            assignedRole: user.role,
            assignedBy: null,
            assignmentNote: roleAssignmentNote || 'Initial admin bootstrapped by setup key',
            plainPassword: password,
        });

        return res.status(201).json({ success: true, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/bootstrap-admin', (req, res) => {
    return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST /api/auth/bootstrap-admin',
    });
});

router.post('/admin/users', protect, authorize('admin', 'Admin'), adminCreateUserValidation, validate, async (req, res) => {
    const { name, email, password, address, birthday, phonenumber, role, roleAssignmentNote } = req.body || {};
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const { storedRole } = parseRole(role);
    if (!storedRole) {
        return res.status(400).json({ error: 'Invalid role supplied' });
    }

    try {
        const user = await createUserRecord({
            name,
            email,
            password,
            address,
            birthday,
            phonenumber,
            role: storedRole,
            roleAssignedBy: req.user?.id || null,
            roleAssignmentNote: roleAssignmentNote || null,
        });

        await logRoleAssignmentHistory({
            targetUserId: user.id,
            assignedRole: user.role,
            assignedBy: req.user?.id || null,
            assignmentNote: roleAssignmentNote || null,
            plainPassword: password,
        });

        return res.status(201).json({ success: true, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/admin/users', (req, res) => {
    return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST /api/auth/admin/users',
    });
});

router.get('/admin/role-assignments', protect, authorize('admin', 'Admin'), async (req, res) => {
    try {
        const assignments = await pool.query(
            `SELECT
                rah.id,
                rah.target_user_id,
                target_user.name,
                target_user.email,
                rah.assigned_role AS role,
                rah.assigned_at AS role_assigned_at,
                rah.assignment_note AS role_assignment_note,
                rah.assigned_by AS role_assigned_by,
                (rah.password_hash IS NOT NULL) AS has_password_hash,
                (rah.password_encrypted IS NOT NULL) AS can_unhash,
                assigner.name AS role_assigned_by_name,
                assigner.email AS role_assigned_by_email
            FROM role_assignment_history rah
            JOIN users target_user ON target_user.id = rah.target_user_id
            LEFT JOIN users assigner ON assigner.id = rah.assigned_by
            ORDER BY rah.assigned_at DESC, rah.id DESC`
        );

        return res.status(200).json({
            success: true,
            count: assignments.rows.length,
            assignments: assignments.rows,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/admin/role-assignments', protect, authorize('admin', 'Admin'), adminRoleAssignmentCreateValidation, validate, async (req, res) => {
    const { targetUserId, targetUserEmail, role, roleAssignmentNote, plainPassword } = req.body || {};

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    const { storedRole } = parseRole(role);
    if (!storedRole) {
        return res.status(400).json({ error: 'Invalid role supplied' });
    }

    if (!targetUserId && !targetUserEmail) {
        return res.status(400).json({ error: 'targetUserId or targetUserEmail is required' });
    }

    try {
        const targetUserResult = targetUserId
            ? await pool.query('SELECT id, name, email FROM users WHERE id = $1 LIMIT 1', [targetUserId])
            : await pool.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', [String(targetUserEmail).trim()]);

        if (!targetUserResult.rows.length) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        const targetUser = targetUserResult.rows[0];

        await logRoleAssignmentHistory({
            targetUserId: targetUser.id,
            assignedRole: storedRole,
            assignedBy: req.user?.id || null,
            assignmentNote: roleAssignmentNote || null,
            plainPassword: plainPassword || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Role history record created successfully',
            targetUser,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unable to create role history record' });
    }
});

router.put('/admin/role-assignments/:historyId', protect, authorize('admin', 'Admin'), historyIdValidation, adminRoleAssignmentUpdateValidation, validate, async (req, res) => {
    const { historyId } = req.params;
    const { role, roleAssignmentNote } = req.body || {};

    if (!role && typeof roleAssignmentNote === 'undefined') {
        return res.status(400).json({ error: 'Nothing to update' });
    }

    try {
        const existing = await pool.query('SELECT id, assigned_role, assignment_note FROM role_assignment_history WHERE id = $1', [historyId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'History record not found' });
        }

        let nextRole = existing.rows[0].assigned_role;
        if (role) {
            const { storedRole } = parseRole(role);
            if (!storedRole) {
                return res.status(400).json({ error: 'Invalid role supplied' });
            }
            nextRole = storedRole;
        }

        const nextNote = typeof roleAssignmentNote === 'undefined'
            ? existing.rows[0].assignment_note
            : roleAssignmentNote;

        const updated = await pool.query(
            `UPDATE role_assignment_history
             SET assigned_role = $2,
                 assignment_note = $3
             WHERE id = $1
             RETURNING id, target_user_id, assigned_role, assigned_by, assignment_note, assigned_at`,
            [historyId, nextRole, nextNote]
        );

        return res.status(200).json({
            success: true,
            message: 'Role history record updated successfully',
            record: updated.rows[0],
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unable to update role history record' });
    }
});

router.delete('/admin/role-assignments/:historyId', protect, authorize('admin', 'Admin'), historyIdValidation, validate, async (req, res) => {
    const { historyId } = req.params;

    try {
        const deleted = await pool.query(
            `DELETE FROM role_assignment_history
             WHERE id = $1
             RETURNING id`,
            [historyId]
        );

        if (!deleted.rows.length) {
            return res.status(404).json({ error: 'History record not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Role history record deleted successfully',
            id: deleted.rows[0].id,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unable to delete role history record' });
    }
});

router.get('/admin/role-assignments/:historyId/unhashed-password', protect, authorize('admin', 'Admin'), historyIdValidation, validate, async (req, res) => {
    const { historyId } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, password_encrypted, password_encryption_iv, password_encryption_tag
             FROM role_assignment_history
             WHERE id = $1`,
            [historyId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'History record not found' });
        }

        const record = result.rows[0];
        if (!record.password_encrypted || !record.password_encryption_iv || !record.password_encryption_tag) {
            return res.status(404).json({ error: 'No encrypted password available for this history record' });
        }

        const unhashedPassword = decryptHistoryPassword({
            encryptedPassword: record.password_encrypted,
            iv: record.password_encryption_iv,
            authTag: record.password_encryption_tag,
        });

        return res.status(200).json({
            success: true,
            historyId: record.id,
            unhashedPassword,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unable to reveal unhashed password' });
    }
});

export default router;




