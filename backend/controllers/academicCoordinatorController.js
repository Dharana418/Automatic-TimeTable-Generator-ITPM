import pool from '../config/db.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get timetables count by status
        const timetablesQuery = `
            SELECT 
                COALESCE(ta.status, 'pending') as status,
                COUNT(*) as count
            FROM timetables t
            LEFT JOIN timetable_approvals ta ON t.id = ta.timetable_id
            GROUP BY ta.status
            UNION ALL
            SELECT 'total' as status, COUNT(*) as count FROM timetables
        `;
        
        // Get conflicts count
        const conflictsQuery = `
            SELECT 
                COUNT(*) as total_conflicts,
                COUNT(CASE WHEN resolved = false THEN 1 END) as active_conflicts,
                COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_conflicts
            FROM scheduling_conflicts
        `;
        
        const [timetablesResult, conflictsResult] = await Promise.all([
            pool.query(timetablesQuery),
            pool.query(conflictsQuery)
        ]);
        
        res.json({
            success: true,
            data: {
                timetables: timetablesResult.rows,
                conflicts: conflictsResult.rows[0]
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all timetables with filters
export const getAllTimetables = async (req, res) => {
    try {
        const { status, semester, year } = req.query;
        
        let query = `
            SELECT 
                t.id,
                t.name,
                t.semester,
                t.year,
                t.status as timetable_status,
                t.created_at,
                u.name as generated_by_name,
                ta.status as approval_status,
                ta.comments as approval_comments,
                ta.approved_at
            FROM timetables t
            LEFT JOIN users u ON t.generated_by = u.id
            LEFT JOIN timetable_approvals ta ON t.id = ta.timetable_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (status && status !== 'all') {
            query += ` AND ta.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (semester) {
            query += ` AND t.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }
        if (year) {
            query += ` AND t.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }
        
        query += ` ORDER BY t.created_at DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch timetables',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Approve timetable
export const approveTimetable = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { comments } = req.body;
        
        await client.query('BEGIN');
        
        // Check if timetable exists
        const timetableCheck = await client.query(
            'SELECT id, name FROM timetables WHERE id = $1',
            [id]
        );
        
        if (timetableCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: 'Timetable not found' 
            });
        }
        
        // Check if already approved
        const existingApproval = await client.query(
            'SELECT status FROM timetable_approvals WHERE timetable_id = $1',
            [id]
        );
        
        if (existingApproval.rows[0]?.status === 'approved') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                success: false, 
                message: 'Timetable is already approved' 
            });
        }
        
        // Update or insert approval
        const approvalResult = await client.query(
            `INSERT INTO timetable_approvals (timetable_id, coordinator_id, status, comments, approved_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (timetable_id) 
             DO UPDATE SET 
                status = EXCLUDED.status,
                comments = EXCLUDED.comments,
                approved_at = EXCLUDED.approved_at,
                coordinator_id = EXCLUDED.coordinator_id
             RETURNING *`,
            [id, req.user.id, 'approved', comments]
        );
        
        // Update timetable status
        await client.query(
            'UPDATE timetables SET status = $1 WHERE id = $2',
            ['approved', id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            data: approvalResult.rows[0],
            message: `Timetable "${timetableCheck.rows[0].name}" approved successfully`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving timetable:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve timetable',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Reject timetable
export const rejectTimetable = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { comments } = req.body;
        
        if (!comments || comments.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Rejection reason is required' 
            });
        }
        
        await client.query('BEGIN');
        
        // Check if timetable exists
        const timetableCheck = await client.query(
            'SELECT id, name FROM timetables WHERE id = $1',
            [id]
        );
        
        if (timetableCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: 'Timetable not found' 
            });
        }
        
        const approvalResult = await client.query(
            `INSERT INTO timetable_approvals (timetable_id, coordinator_id, status, comments, approved_at)
             VALUES ($1, $2, $3, $4, NULL)
             ON CONFLICT (timetable_id) 
             DO UPDATE SET 
                status = EXCLUDED.status,
                comments = EXCLUDED.comments,
                approved_at = NULL,
                coordinator_id = EXCLUDED.coordinator_id
             RETURNING *`,
            [id, req.user.id, 'rejected', comments]
        );
        
        await client.query(
            'UPDATE timetables SET status = $1 WHERE id = $2',
            ['rejected', id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            data: approvalResult.rows[0],
            message: `Timetable "${timetableCheck.rows[0].name}" rejected`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting timetable:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject timetable',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Get all scheduling conflicts
export const getConflicts = async (req, res) => {
    try {
        const { resolved, severity } = req.query;
        
        let query = `
            SELECT 
                sc.*,
                t.name as timetable_name,
                t.semester,
                t.year,
                u.name as resolved_by_name
            FROM scheduling_conflicts sc
            LEFT JOIN timetables t ON sc.timetable_id = t.id
            LEFT JOIN users u ON sc.resolved_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (resolved !== undefined) {
            query += ` AND sc.resolved = $${paramIndex}`;
            params.push(resolved === 'true');
            paramIndex++;
        }
        if (severity) {
            query += ` AND sc.severity = $${paramIndex}`;
            params.push(severity);
            paramIndex++;
        }
        
        query += ` ORDER BY 
            CASE sc.severity 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
            END, 
            sc.created_at DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching conflicts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch conflicts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Resolve conflict
export const resolveConflict = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        
        const result = await pool.query(
            `UPDATE scheduling_conflicts 
             SET 
                resolved = TRUE,
                resolved_at = CURRENT_TIMESTAMP,
                resolved_by = $1,
                resolution_notes = COALESCE($2, resolution_notes)
             WHERE id = $3
             RETURNING *`,
            [req.user.id, resolution_notes, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conflict not found' 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Conflict resolved successfully'
        });
    } catch (error) {
        console.error('Error resolving conflict:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to resolve conflict',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Generate reports
export const getScheduleReports = async (req, res) => {
    try {
        const { start_date, end_date, report_type = 'summary' } = req.query;
        
        let result;
        
        if (report_type === 'summary') {
            const query = `
                SELECT 
                    COUNT(DISTINCT t.id) as total_timetables,
                    COUNT(DISTINCT CASE WHEN ta.status = 'approved' THEN t.id END) as approved_timetables,
                    COUNT(DISTINCT CASE WHEN ta.status = 'pending' THEN t.id END) as pending_timetables,
                    COUNT(DISTINCT CASE WHEN ta.status = 'rejected' THEN t.id END) as rejected_timetables,
                    COUNT(DISTINCT sc.id) as total_conflicts,
                    COUNT(DISTINCT CASE WHEN sc.resolved = true THEN sc.id END) as resolved_conflicts,
                    COUNT(DISTINCT CASE WHEN sc.resolved = false THEN sc.id END) as active_conflicts,
                    ROUND(COUNT(DISTINCT CASE WHEN ta.status = 'approved' THEN t.id END)::numeric / 
                          NULLIF(COUNT(DISTINCT t.id), 0) * 100, 2) as approval_rate,
                    ROUND(COUNT(DISTINCT CASE WHEN sc.resolved = true THEN sc.id END)::numeric / 
                          NULLIF(COUNT(DISTINCT sc.id), 0) * 100, 2) as resolution_rate
                FROM timetables t
                LEFT JOIN timetable_approvals ta ON t.id = ta.timetable_id
                LEFT JOIN scheduling_conflicts sc ON t.id = sc.timetable_id
                WHERE ($1::date IS NULL OR t.created_at >= $1::date)
                AND ($2::date IS NULL OR t.created_at <= $2::date)
            `;
            
            result = await pool.query(query, [start_date || null, end_date || null]);
        } else if (report_type === 'detailed') {
            const query = `
                SELECT 
                    t.id as timetable_id,
                    t.name as timetable_name,
                    t.semester,
                    t.year,
                    t.created_at,
                    ta.status as approval_status,
                    ta.approved_at,
                    COUNT(DISTINCT sc.id) as conflict_count,
                    COUNT(DISTINCT CASE WHEN sc.resolved = true THEN sc.id END) as resolved_conflicts
                FROM timetables t
                LEFT JOIN timetable_approvals ta ON t.id = ta.timetable_id
                LEFT JOIN scheduling_conflicts sc ON t.id = sc.timetable_id
                WHERE ($1::date IS NULL OR t.created_at >= $1::date)
                AND ($2::date IS NULL OR t.created_at <= $2::date)
                GROUP BY t.id, t.name, t.semester, t.year, t.created_at, ta.status, ta.approved_at
                ORDER BY t.created_at DESC
            `;
            
            result = await pool.query(query, [start_date || null, end_date || null]);
        }
        
        res.json({
            success: true,
            data: {
                report_type,
                period: { start_date, end_date },
                generated_at: new Date(),
                ...result.rows[0]
            }
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate reports',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get academic calendar
export const getAcademicCalendar = async (req, res) => {
    try {
        const { year, semester, event_type } = req.query;
        
        let query = `
            SELECT 
                ac.*,
                u.name as created_by_name
            FROM academic_calendar ac
            LEFT JOIN users u ON ac.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (year) {
            query += ` AND ac.academic_year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }
        if (semester) {
            query += ` AND ac.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }
        if (event_type) {
            query += ` AND ac.event_type = $${paramIndex}`;
            params.push(event_type);
            paramIndex++;
        }
        
        query += ` ORDER BY ac.start_date ASC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching academic calendar:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch academic calendar',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create academic event
export const createAcademicEvent = async (req, res) => {
    try {
        const { event_name, event_type, start_date, end_date, academic_year, semester } = req.body;
        
        // Validation
        if (!event_name || !event_type || !start_date || !end_date || !academic_year) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO academic_calendar 
                (event_name, event_type, start_date, end_date, academic_year, semester, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [event_name, event_type, start_date, end_date, academic_year, semester, req.user.id]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Event created successfully'
        });
    } catch (error) {
        console.error('Error creating academic event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update academic event
export const updateAcademicEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { event_name, event_type, start_date, end_date, academic_year, semester } = req.body;
        
        const result = await pool.query(
            `UPDATE academic_calendar 
             SET 
                event_name = COALESCE($1, event_name),
                event_type = COALESCE($2, event_type),
                start_date = COALESCE($3, start_date),
                end_date = COALESCE($4, end_date),
                academic_year = COALESCE($5, academic_year),
                semester = COALESCE($6, semester)
             WHERE id = $7
             RETURNING *`,
            [event_name, event_type, start_date, end_date, academic_year, semester, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating academic event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete academic event
export const deleteAcademicEvent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM academic_calendar WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting academic event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Override constraint
export const overrideConstraint = async (req, res) => {
    try {
        const { constraint_type, description, reason } = req.body;
        
        if (!constraint_type || !reason) {
            return res.status(400).json({ 
                success: false, 
                message: 'Constraint type and reason are required' 
            });
        }
        
        // Log the override (you can store in a separate table if needed)
        console.log(`[OVERRIDE] ${new Date().toISOString()} - User ${req.user.id} overrode ${constraint_type}: ${reason}`);
        
        res.json({
            success: true,
            message: 'Constraint override applied',
            data: {
                constraint_type,
                description: description || null,
                reason,
                overridden_by: {
                    id: req.user.id,
                    name: req.user.name,
                    role: req.user.role
                },
                overridden_at: new Date()
            }
        });
    } catch (error) {
        console.error('Error overriding constraint:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to override constraint',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};