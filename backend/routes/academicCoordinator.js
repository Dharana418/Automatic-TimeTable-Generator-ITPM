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

// ============= MODULE MANAGEMENT BY ACADEMIC YEAR =============

// Get all academic years with module count
router.get('/modules/years', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT academic_year, COUNT(*) AS module_count
      FROM modules
      WHERE academic_year IS NOT NULL
      GROUP BY academic_year
      ORDER BY academic_year DESC
    `);

    return res.json({
      success: true,
      data: rows,
      total_years: rows.length,
    });
  } catch (err) {
    console.error('Error fetching academic years:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch academic years' });
  }
});

// Get modules for a specific academic year
router.get('/modules/year/:academicYear', async (req, res) => {
  try {
    const { academicYear } = req.params;
    const { semester } = req.query;

    let query = `
      SELECT 
        id,
        code,
        name,
        batch_size,
        day_type,
        credits,
        lectures_per_week,
        academic_year,
        semester,
        lic_id,
        details,
        created_at,
        created_by
      FROM modules
      WHERE academic_year = $1
    `;
    const params = [academicYear];

    if (semester) {
      query += ` AND semester = $${params.length + 1}`;
      params.push(semester);
    }

    query += ` ORDER BY code ASC`;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      academic_year: academicYear,
      semester: semester || 'all',
      data: rows,
      total_modules: rows.length,
    });
  } catch (err) {
    console.error('Error fetching modules for year:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch modules for year' });
  }
});

// Add new module for a specific academic year (Academic Coordinator only)
router.post('/modules/year/:academicYear', authorize('admin', 'academiccoordinator', 'Admin', 'Academic Coordinator'), async (req, res) => {
  try {
    const { academicYear } = req.params;
    const {
      code,
      name,
      batch_size,
      day_type,
      credits,
      lectures_per_week,
      semester,
      details,
      lic_id,
    } = req.body || {};

    // Validation
    if (!code || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Module code and name are required' 
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required',
      });
    }

    // Check if module code already exists for this year
    const existing = await pool.query(
      'SELECT id, code FROM modules WHERE code = $1 AND academic_year = $2',
      [code, academicYear]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Module with code '${code}' already exists for academic year ${academicYear}`,
        existing: existing.rows[0],
      });
    }

    const moduleId = `module_${academicYear}_${code}_${Date.now()}`;

    const { rows } = await pool.query(
      `INSERT INTO modules (
        id, code, name, batch_size, day_type, credits, lectures_per_week, 
        academic_year, semester, details, lic_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, code, name, batch_size, day_type, credits, lectures_per_week, 
                academic_year, semester, details, lic_id, created_at, created_by`,
      [
        moduleId,
        code,
        name,
        batch_size || null,
        day_type || null,
        credits || null,
        lectures_per_week || null,
        academicYear,
        semester || null,
        details ? JSON.stringify(details) : null,
        lic_id || null,
        req.user?.id || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Module '${code}' added for academic year ${academicYear}`,
      data: rows[0],
    });
  } catch (err) {
    console.error('Error adding module for year:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to add module' });
  }
});

// Update module for a specific academic year
router.put('/modules/year/:academicYear/:moduleId', authorize('admin', 'academiccoordinator', 'Admin', 'Academic Coordinator'), async (req, res) => {
  try {
    const { academicYear, moduleId } = req.params;
    const {
      code,
      name,
      batch_size,
      day_type,
      credits,
      lectures_per_week,
      semester,
      details,
    } = req.body || {};

    // Get existing module
    const existing = await pool.query(
      'SELECT * FROM modules WHERE id = $1 AND academic_year = $2',
      [moduleId, academicYear]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this academic year',
      });
    }

    // If code is being changed, check for conflicts
    if (code && code !== existing.rows[0].code) {
      const conflicting = await pool.query(
        'SELECT id FROM modules WHERE code = $1 AND academic_year = $2 AND id != $3',
        [code, academicYear, moduleId]
      );
      if (conflicting.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Module code '${code}' already exists for this academic year`,
        });
      }
    }

    const { rows } = await pool.query(
      `UPDATE modules SET
        code = COALESCE($2, code),
        name = COALESCE($3, name),
        batch_size = COALESCE($4, batch_size),
        day_type = COALESCE($5, day_type),
        credits = COALESCE($6, credits),
        lectures_per_week = COALESCE($7, lectures_per_week),
        semester = COALESCE($8, semester),
        details = COALESCE($9, details)
      WHERE id = $1 AND academic_year = $10
      RETURNING id, code, name, batch_size, day_type, credits, lectures_per_week,
                academic_year, semester, details, lic_id, created_at`,
      [
        moduleId,
        code || null,
        name || null,
        batch_size || null,
        day_type || null,
        credits || null,
        lectures_per_week || null,
        semester || null,
        details ? JSON.stringify(details) : null,
        academicYear,
      ]
    );

    return res.json({
      success: true,
      message: 'Module updated successfully',
      data: rows[0],
    });
  } catch (err) {
    console.error('Error updating module:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update module' });
  }
});

// Delete module for a specific academic year
router.delete('/modules/year/:academicYear/:moduleId', authorize('admin', 'academiccoordinator', 'Admin', 'Academic Coordinator'), async (req, res) => {
  try {
    const { academicYear, moduleId } = req.params;

    const { rows, rowCount } = await pool.query(
      'DELETE FROM modules WHERE id = $1 AND academic_year = $2 RETURNING id, code, name',
      [moduleId, academicYear]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Module not found for this academic year',
      });
    }

    return res.json({
      success: true,
      message: `Module '${rows[0].code}' deleted from academic year ${academicYear}`,
      data: rows[0],
    });
  } catch (err) {
    console.error('Error deleting module:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete module' });
  }
});

// Get modules by year and semester summary
router.get('/modules/summary/year-semester', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        academic_year,
        semester,
        COUNT(*) AS module_count,
        STRING_AGG(DISTINCT code, ', ' ORDER BY code) AS module_codes,
        ARRAY_AGG(DISTINCT credits) AS credit_distribution
      FROM modules
      WHERE academic_year IS NOT NULL
      GROUP BY academic_year, semester
      ORDER BY academic_year DESC, semester ASC
    `);

    return res.json({
      success: true,
      data: rows,
      total_records: rows.length,
    });
  } catch (err) {
    console.error('Error fetching module summary:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch module summary' });
  }
});

export default router;
