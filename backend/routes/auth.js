import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import protect from '../middlewares/auth.js';


const router = express.Router();

const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}
router.post('/register', async (req, res) => {
    const { name, email, password, address, birthday, phonenumber, role } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    try {
        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, address, birthday, phonenumber, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, hashedPassword, address, birthday, phonenumber, role]
        );
        const token = generateToken(newUser.rows[0]);
        res.cookie('token', token, cookieOptions);
        res.status(201).json({ user: newUser.rows[0], token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
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

export default router;




