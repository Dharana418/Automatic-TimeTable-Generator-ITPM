import express from 'express';
import pool from '../config/db.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();
const ROLE_GUARD = [protect, authorize('admin', 'academic coordinator', 'academiccoordinator')];

router.get('/timetables', ...ROLE_GUARD, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          t.id,
          t.name,
          t.semester,
          t.year,
          t.created_at,
          t.data,
          COALESCE(ta.status, t.status, 'pending') AS approval_status,
          ta.comments AS approval_comments,
          ta.approved_at
       FROM timetables t
       LEFT JOIN timetable_approvals ta ON ta.timetable_id = t.id
       ORDER BY t.created_at DESC, t.id DESC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load timetables' });
  }
});

router.put('/timetables/:id/approve', ...ROLE_GUARD, async (req, res) => {
  const timetableId = Number(req.params.id);
  const comments = req.body?.comments || null;

  if (!Number.isInteger(timetableId) || timetableId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid timetable id' });
  }

  try {
    const existingTimetable = await pool.query('SELECT id FROM timetables WHERE id = $1 LIMIT 1', [timetableId]);
    if (!existingTimetable.rows.length) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await pool.query(
      `INSERT INTO timetable_approvals (timetable_id, coordinator_id, status, comments, approved_at)
       VALUES ($1, $2, 'approved', $3, NOW())
       ON CONFLICT (timetable_id)
       DO UPDATE SET
         coordinator_id = EXCLUDED.coordinator_id,
         status = EXCLUDED.status,
         comments = EXCLUDED.comments,
         approved_at = EXCLUDED.approved_at`,
      [timetableId, req.user.id, comments]
    );

    await pool.query('UPDATE timetables SET status = $2 WHERE id = $1', [timetableId, 'approved']);

    return res.status(200).json({ success: true, message: 'Timetable approved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to approve timetable' });
  }
});

router.put('/timetables/:id/reject', ...ROLE_GUARD, async (req, res) => {
  const timetableId = Number(req.params.id);
  const comments = req.body?.comments || null;

  if (!Number.isInteger(timetableId) || timetableId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid timetable id' });
  }

  try {
    const existingTimetable = await pool.query('SELECT id FROM timetables WHERE id = $1 LIMIT 1', [timetableId]);
    if (!existingTimetable.rows.length) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await pool.query(
      `INSERT INTO timetable_approvals (timetable_id, coordinator_id, status, comments, approved_at)
       VALUES ($1, $2, 'rejected', $3, NOW())
       ON CONFLICT (timetable_id)
       DO UPDATE SET
         coordinator_id = EXCLUDED.coordinator_id,
         status = EXCLUDED.status,
         comments = EXCLUDED.comments,
         approved_at = EXCLUDED.approved_at`,
      [timetableId, req.user.id, comments]
    );

    await pool.query('UPDATE timetables SET status = $2 WHERE id = $1', [timetableId, 'rejected']);

    return res.status(200).json({ success: true, message: 'Timetable rejected successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to reject timetable' });
  }
});

router.get('/conflicts', ...ROLE_GUARD, async (req, res) => {
  const { resolved } = req.query || {};
  const hasResolvedFilter = typeof resolved !== 'undefined';
  const resolvedFlag = String(resolved).toLowerCase() === 'true';

  try {
    const result = hasResolvedFilter
      ? await pool.query(
          `SELECT
              sc.*,
              t.name AS timetable_name
           FROM scheduling_conflicts sc
           LEFT JOIN timetables t ON t.id = sc.timetable_id
           WHERE sc.resolved = $1
           ORDER BY sc.created_at DESC, sc.id DESC`,
          [resolvedFlag]
        )
      : await pool.query(
          `SELECT
              sc.*,
              t.name AS timetable_name
           FROM scheduling_conflicts sc
           LEFT JOIN timetables t ON t.id = sc.timetable_id
           ORDER BY sc.created_at DESC, sc.id DESC`
        );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load conflicts' });
  }
});

router.put('/conflicts/:id/resolve', ...ROLE_GUARD, async (req, res) => {
  const conflictId = Number(req.params.id);
  const resolutionNotes = req.body?.resolution_notes || null;

  if (!Number.isInteger(conflictId) || conflictId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid conflict id' });
  }

  try {
    const updated = await pool.query(
      `UPDATE scheduling_conflicts
       SET resolved = TRUE,
           resolved_at = NOW(),
           resolved_by = $2,
           resolution_notes = $3
       WHERE id = $1
       RETURNING id`,
      [conflictId, req.user.id, resolutionNotes]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ success: false, message: 'Conflict not found' });
    }

    return res.status(200).json({ success: true, message: 'Conflict resolved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to resolve conflict' });
  }
});

router.get('/calendar', ...ROLE_GUARD, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM academic_calendar ORDER BY start_date ASC, id ASC');
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load academic calendar' });
  }
});

router.post('/calendar', ...ROLE_GUARD, async (req, res) => {
  const { event_name, event_type, start_date, end_date, academic_year, semester } = req.body || {};

  if (!event_name || !event_type || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'event_name, event_type, start_date and end_date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO academic_calendar (event_name, event_type, start_date, end_date, academic_year, semester, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        event_name,
        event_type,
        start_date,
        end_date,
        academic_year || null,
        semester || null,
        req.user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Calendar event added successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to create calendar event' });
  }
});

export default router;
