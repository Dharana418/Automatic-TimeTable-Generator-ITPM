import express from 'express';
import pool from '../config/db.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

const normalizeSpecializationCode = (value = '') => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return '';

  const aliases = {
    SOFTWAREENGINEERING: 'SE',
    SOFTWARE_ENG: 'SE',
    INFORMATIONTECHNOLOGY: 'IT',
    INTERACTIVEMEDIA: 'IME',
    COMPUTERSCIENCE: 'CS',
    INFORMATIONSYSTEMSENGINEERING: 'ISE',
    COMPUTER_SYSTEMS_NETWORK_ENGINEERING: 'CSNE',
    INFORMATICS: 'IM',
    CYBERSECURITY: 'CYBER SECURITY',
    CYBER: 'CYBER SECURITY',
  };

  const compact = normalized.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || normalized;
};

const parseJsonSafe = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeScopeValue = (value = '') => String(value || '').trim().toUpperCase();

const inferModuleSpecialization = (module = {}) => {
  const details = parseJsonSafe(module.details, {});
  const explicit =
    details.specialization ||
    details.spec ||
    details.stream ||
    details.department ||
    module.specialization;

  if (explicit) {
    return normalizeSpecializationCode(explicit);
  }

  const code = String(module.code || '').toUpperCase();
  if (code.startsWith('IT')) return 'IT';
  if (code.startsWith('SE')) return 'SE';
  if (code.startsWith('IE') || code.startsWith('IM')) return 'IME';
  if (code.startsWith('CS')) return 'CS';
  if (code.startsWith('IS')) return 'ISE';
  if (code.startsWith('CN')) return 'CSNE';
  return 'GENERAL';
};

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
    const requestedYear = String(req.query.year || req.query.academicYear || '').trim();
    const requestedSemester = String(req.query.semester || '').trim();
    const requestedSpecialization = normalizeScopeValue(req.query.specialization || '');
    const requestedGroup = String(req.query.group || '').trim();
    const requestedSubgroup = String(req.query.subgroup || '').trim();

    const { rows } = await pool.query('SELECT * FROM timetables ORDER BY created_at DESC');

    const filtered = rows.filter((row) => {
      const data = parseJsonSafe(row.data, {});
      const scope = parseJsonSafe(data.scope, {});
      const dataYear = String(scope.year || data.year || data.academicYear || row.year || '').trim();
      const dataSemester = String(scope.semester || data.semester || row.semester || '').trim();
      const dataSpecialization = normalizeScopeValue(scope.specialization || data.specialization || '');
      const dataGroup = String(scope.group || data.group || '').trim();
      const dataSubgroup = String(scope.subgroup || data.subgroup || '').trim();

      if (requestedYear && dataYear !== requestedYear) return false;
      if (requestedSemester && dataSemester !== requestedSemester) return false;
      if (requestedSpecialization && dataSpecialization !== requestedSpecialization) return false;
      if (requestedGroup && dataGroup !== requestedGroup) return false;
      if (requestedSubgroup && dataSubgroup !== requestedSubgroup) return false;
      return true;
    });

    return res.json({ success: true, data: filtered });
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

router.put('/calendar/:id', async (req, res) => {
  try {
    const { id } = req.params;
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

    const { rows, rowCount } = await pool.query(
      `UPDATE academic_calendar
       SET event_name = $1,
           event_type = $2,
           start_date = $3,
           end_date = $4,
           academic_year = $5,
           semester = $6
       WHERE id = $7
       RETURNING *`,
      [
        event_name,
        event_type,
        start_date,
        end_date || start_date,
        academic_year,
        semester,
        id
      ]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Calendar event not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/calendar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM academic_calendar WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Calendar event not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/modules/years', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT academic_year, COUNT(*) as module_count 
       FROM modules 
       WHERE academic_year IS NOT NULL 
       GROUP BY academic_year 
       ORDER BY academic_year DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/modules/year/:academicYear', async (req, res) => {
  try {
    const { academicYear } = req.params;
    const { semester, specialization } = req.query;
    
    let query = `
      SELECT m.*
      FROM modules m
      JOIN users u ON u.id = m.created_by
      WHERE m.academic_year = $1
        AND regexp_replace(lower(COALESCE(u.role, '')), '[^a-z0-9]', '', 'g') = 'academiccoordinator'
    `;
    const params = [academicYear];
    
    if (semester) {
      params.push(semester);
      query += ` AND m.semester = $${params.length}`;
    }
    
    query += ` ORDER BY m.created_at DESC`;
    
    const { rows } = await pool.query(query, params);
    
    let filtered = rows;
    if (specialization && specialization.toUpperCase() !== 'ALL') {
      const requestedSpecialization = normalizeSpecializationCode(specialization);
      filtered = rows.filter((module) => {
        const moduleSpecialization = normalizeSpecializationCode(inferModuleSpecialization(module));
        if (requestedSpecialization === 'ENGINEERING') {
          return ['CS', 'ISE', 'CSNE', 'IME', 'IM'].includes(moduleSpecialization);
        }
        if (requestedSpecialization === 'IM') {
          return moduleSpecialization === 'IM' || moduleSpecialization === 'IME';
        }
        return moduleSpecialization === requestedSpecialization;
      });
    }
    
    return res.json({ success: true, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
