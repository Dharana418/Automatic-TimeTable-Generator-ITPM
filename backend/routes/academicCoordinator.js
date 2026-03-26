import express from 'express';
import pool from '../config/db.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.use(protect);
router.use(
  authorize(
    'admin',
    'facultycoordinator',
    'academiccoordinator',
    'lic',
    'instructor',
    'professor',
    'lecturer',
    'assistantlecturer',
    'seniorlecturer',
    'lecturerseniorlecturer',
    'Admin',
    'Faculty Coordinator',
    'Academic Coordinator',
    'LIC',
    'Instructor',
    'Professor',
    'Lecturer',
    'Assistant Lecturer',
    'Senior Lecturer',
    'Lecturer/Senior Lecturer'
  )
);

router.get('/timetables', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM timetables ORDER BY created_at DESC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/timetables/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, rowCount } = await pool.query(
      `UPDATE timetables
       SET status = 'approved'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/timetables/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = req.body?.comments || null;

    const { rows, rowCount } = await pool.query(
      `UPDATE timetables
       SET status = 'rejected'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    if (comments) {
      await pool.query(
        `INSERT INTO timetable_approvals (timetable_id, coordinator_id, status, comments, approved_at)
         VALUES ($1, $2, 'rejected', $3, NOW())
         ON CONFLICT (timetable_id)
         DO UPDATE SET status = 'rejected', comments = EXCLUDED.comments, approved_at = EXCLUDED.approved_at`,
        [id, req.user?.id || null, comments]
      );
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/conflicts', async (req, res) => {
  try {
    const hasResolvedFilter = typeof req.query.resolved !== 'undefined';
    if (!hasResolvedFilter) {
      const { rows } = await pool.query(
        'SELECT * FROM scheduling_conflicts ORDER BY created_at DESC'
      );
      return res.json({ success: true, data: rows });
    }

    const resolved = String(req.query.resolved).toLowerCase() === 'true';
    const { rows } = await pool.query(
      'SELECT * FROM scheduling_conflicts WHERE resolved = $1 ORDER BY created_at DESC',
      [resolved]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/conflicts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const resolutionNotes = req.body?.resolution_notes || null;

    const { rows, rowCount } = await pool.query(
      `UPDATE scheduling_conflicts
       SET resolved = TRUE,
           resolved_at = NOW(),
           resolved_by = $2,
           resolution_notes = $3
       WHERE id = $1
       RETURNING *`,
      [id, req.user?.id || null, resolutionNotes]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Conflict not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/calendar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM academic_calendar ORDER BY start_date ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calendar', async (req, res) => {
  try {
    const {
      event_name,
      event_type,
      start_date,
      end_date,
      academic_year,
      semester,
    } = req.body || {};

    if (!event_name || !event_type || !start_date || !academic_year || !semester) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { rows } = await pool.query(
      `INSERT INTO academic_calendar (event_name, event_type, start_date, end_date, academic_year, semester, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        event_name,
        event_type,
        start_date,
        end_date || start_date,
        academic_year,
        semester,
        req.user?.id || null,
      ]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
