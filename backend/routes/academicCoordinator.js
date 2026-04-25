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

const TIMETABLE_YEAR_REGEX = /^([Yy]?(?:[1-9]|1[0-2])|\d{4}-\d{4})$/;
const SEMESTER_REGEX = /^[12]$/;
const GROUP_REGEX = /^\d{1,2}$/;
const SPECIALIZATION_REGEX = /^[A-Za-z][A-Za-z0-9\s_-]{0,39}$/;
const REVIEW_NOTE_REGEX = /^.{5,500}$/s;
const CALENDAR_EVENT_TYPES = new Set(['semester_start', 'exam_period', 'holiday', 'deadline', 'other']);

const buildValidationError = (errors) => ({
  success: false,
  error: errors[0],
  details: errors,
});

const validateTimetableQuery = (req, res, next) => {
  const errors = [];
  const requestedYear = String(req.query.year || req.query.academicYear || '').trim();
  const requestedSemester = String(req.query.semester || '').trim();
  const requestedSpecialization = normalizeScopeValue(req.query.specialization || '');
  const requestedGroup = String(req.query.group || '').trim();
  const requestedSubgroup = String(req.query.subgroup || '').trim();

  if (requestedYear && !TIMETABLE_YEAR_REGEX.test(requestedYear)) {
    errors.push('year must be a valid year level or academic year range');
  }
  if (requestedSemester && !SEMESTER_REGEX.test(requestedSemester)) {
    errors.push('semester must be 1 or 2');
  }
  if (requestedSpecialization && !SPECIALIZATION_REGEX.test(requestedSpecialization)) {
    errors.push('specialization contains invalid characters');
  }
  if (requestedGroup && !GROUP_REGEX.test(requestedGroup)) {
    errors.push('group must be numeric');
  }
  if (requestedSubgroup && !GROUP_REGEX.test(requestedSubgroup)) {
    errors.push('subgroup must be numeric');
  }

  if (errors.length > 0) {
    return res.status(400).json(buildValidationError(errors));
  }

  return next();
};

const validatePositiveIntegerParam = (paramName) => (req, res, next) => {
  const value = Number(req.params?.[paramName]);
  if (!Number.isInteger(value) || value <= 0) {
    return res.status(400).json({
      success: false,
      error: `${paramName} must be a positive integer`,
    });
  }
  return next();
};

const validateReviewComment = (fieldName) => (req, res, next) => {
  const value = req.body?.[fieldName];
  if (value === undefined || value === null || value === '') {
    return next();
  }

  const text = String(value).trim();
  if (!REVIEW_NOTE_REGEX.test(text)) {
    return res.status(400).json({
      success: false,
      error: `${fieldName} must be between 5 and 500 characters`,
    });
  }

  return next();
};

const validateTimetableEditPayload = (req, res, next) => {
  const schedule = req.body?.schedule;

  if (!Array.isArray(schedule)) {
    return res.status(400).json({
      success: false,
      error: 'schedule must be an array',
    });
  }

  if (schedule.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'schedule contains too many rows',
    });
  }

  for (let i = 0; i < schedule.length; i += 1) {
    const row = schedule[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return res.status(400).json({
        success: false,
        error: `schedule[${i}] must be an object`,
      });
    }

    const day = String(row.day || row.dayOfWeek || row.weekday || '').trim();
    const time = String(row.timeSlot || row.slot || row.time || row.timeslot || '').trim();

    if (!day || !time) {
      return res.status(400).json({
        success: false,
        error: `schedule[${i}] must include valid day and time`,
      });
    }
  }

  return next();
};

const validateCalendarPayload = (req, res, next) => {
  const errors = [];
  const {
    event_name,
    event_type,
    start_date,
    end_date,
    academic_year,
    semester,
  } = req.body || {};

  if (!event_name || typeof event_name !== 'string' || event_name.trim().length < 3 || event_name.trim().length > 120) {
    errors.push('event_name must be between 3 and 120 characters');
  }

  const normalizedType = String(event_type || '').trim().toLowerCase();
  if (!CALENDAR_EVENT_TYPES.has(normalizedType)) {
    errors.push('event_type is not allowed');
  }

  const start = new Date(start_date);
  if (!start_date || Number.isNaN(start.getTime())) {
    errors.push('start_date must be a valid ISO date');
  }

  if (end_date) {
    const end = new Date(end_date);
    if (Number.isNaN(end.getTime())) {
      errors.push('end_date must be a valid ISO date when provided');
    } else if (!Number.isNaN(start.getTime()) && end.getTime() < start.getTime()) {
      errors.push('end_date cannot be earlier than start_date');
    }
  }

  if (!academic_year || !TIMETABLE_YEAR_REGEX.test(String(academic_year).trim())) {
    errors.push('academic_year must be a valid year level or academic year range');
  }

  if (!semester || !SEMESTER_REGEX.test(String(semester).trim())) {
    errors.push('semester must be 1 or 2');
  }

  if (errors.length > 0) {
    return res.status(400).json(buildValidationError(errors));
  }

  return next();
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

router.get('/timetables', validateTimetableQuery, async (req, res) => {
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

router.get('/timetables/edit-history', async (req, res) => {
  try {
    const limitParam = Number(req.query.limit);
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 200)
      : 50;

    const { rows } = await pool.query(
      `SELECT
         h.id,
         h.timetable_id,
         h.edited_by,
         h.edited_at,
         h.previous_schedule,
         h.updated_schedule,
         t.name AS timetable_name,
         u.name AS editor_name,
         COALESCE(jsonb_array_length(h.previous_schedule), 0) AS previous_count,
         COALESCE(jsonb_array_length(h.updated_schedule), 0) AS updated_count
       FROM timetable_edit_history h
       LEFT JOIN timetables t ON t.id = h.timetable_id
       LEFT JOIN users u ON u.id = h.edited_by
       ORDER BY h.edited_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/timetables/:id/approve', validatePositiveIntegerParam('id'), async (req, res) => {
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

router.put('/timetables/:id/reject', validatePositiveIntegerParam('id'), validateReviewComment('comments'), async (req, res) => {
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

router.put('/timetables/:id/edit', validatePositiveIntegerParam('id'), validateTimetableEditPayload, async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = req.body?.schedule || [];

    const existingRes = await pool.query(
      'SELECT * FROM timetables WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!existingRes.rowCount) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }

    const existing = existingRes.rows[0];
    const existingData = parseJsonSafe(existing.data, {});
    const previousSchedule = Array.isArray(existingData?.schedule) ? existingData.schedule : [];
    const mergedData = {
      ...existingData,
      schedule,
    };

    const updateRes = await pool.query(
      `UPDATE timetables
       SET data = $2::jsonb
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(mergedData)]
    );

    await pool.query(
      `INSERT INTO timetable_edit_history (timetable_id, edited_by, previous_schedule, updated_schedule)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
      [id, req.user?.id || null, JSON.stringify(previousSchedule), JSON.stringify(schedule)]
    );

    return res.json({ success: true, data: updateRes.rows[0] });
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

router.put('/conflicts/:id/resolve', validatePositiveIntegerParam('id'), validateReviewComment('resolution_notes'), async (req, res) => {
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

router.post('/calendar', validateCalendarPayload, async (req, res) => {
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

router.put('/calendar/:id', validatePositiveIntegerParam('id'), validateCalendarPayload, async (req, res) => {
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

router.delete('/calendar/:id', validatePositiveIntegerParam('id'), async (req, res) => {
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
    if (!TIMETABLE_YEAR_REGEX.test(String(academicYear).trim())) {
      return res.status(400).json({ success: false, error: 'academicYear must be a valid year level or academic year range' });
    }

    if (semester && !SEMESTER_REGEX.test(String(semester).trim())) {
      return res.status(400).json({ success: false, error: 'semester must be 1 or 2' });
    }

    if (specialization && !SPECIALIZATION_REGEX.test(String(specialization).trim())) {
      return res.status(400).json({ success: false, error: 'specialization contains invalid characters' });
    }

    const moduleLimitPerSpecialization = 5;
    
    let query = `
      SELECT m.*
      FROM modules m
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.academic_year = $1
        AND (
          regexp_replace(lower(COALESCE(u.role, '')), '[^a-z0-9]', '', 'g') = 'academiccoordinator'
          OR m.created_by IS NULL
          OR lower(COALESCE(m.details::jsonb ->> 'source', '')) = 'catalog-replacement'
        )
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

    const limited = filtered.slice(0, moduleLimitPerSpecialization);
    
    return res.json({
      success: true,
      data: limited,
      total: limited.length,
      limit: moduleLimitPerSpecialization,
      filters: {
        year: academicYear,
        semester: semester || null,
        specialization: specialization || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/modules/persist-all', async (req, res) => {
  const roleKey = String(req.user?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!['academiccoordinator', 'admin'].includes(roleKey)) {
    return res.status(403).json({ success: false, error: 'Only Academic Coordinator or Admin can persist modules' });
  }

  const payloadModules = Array.isArray(req.body?.modules) ? req.body.modules : [];
  if (!payloadModules.length) {
    return res.status(400).json({ success: false, error: 'modules array is required' });
  }

  if (payloadModules.length > 5000) {
    return res.status(400).json({ success: false, error: 'Too many modules in one request (max 5000)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let inserted = 0;
    let updated = 0;
    const skipped = [];

    for (let index = 0; index < payloadModules.length; index += 1) {
      const rawModule = payloadModules[index] || {};

      const code = String(rawModule.code || '').trim().toUpperCase();
      const name = String(rawModule.name || '').trim();
      const specialization = normalizeSpecializationCode(rawModule.specialization || rawModule.department || 'GENERAL') || 'GENERAL';
      const academicYear = Number(rawModule.academic_year || rawModule.academicYear || 0);
      const semester = Number(rawModule.semester || 0);

      const normalizedAcademicYear = [1, 2, 3, 4].includes(academicYear) ? academicYear : null;
      const normalizedSemester = [1, 2].includes(semester) ? semester : null;
      const credits = rawModule.credits === '' || rawModule.credits == null ? null : Number(rawModule.credits);
      const lecturesPerWeek = rawModule.lectures_per_week === '' || rawModule.lectures_per_week == null
        ? (rawModule.lecturesPerWeek === '' || rawModule.lecturesPerWeek == null ? null : Number(rawModule.lecturesPerWeek))
        : Number(rawModule.lectures_per_week);
      const batchSize = rawModule.batch_size === '' || rawModule.batch_size == null ? null : Number(rawModule.batch_size);
      const dayType = rawModule.day_type || null;

      if (!code || !name) {
        skipped.push({ index, reason: 'Missing code or name', code: code || null });
        continue;
      }

      const sourceDetails = parseJsonSafe(rawModule.details, {});
      const details = {
        ...sourceDetails,
        specialization,
        ...(normalizedAcademicYear ? { academic_year: normalizedAcademicYear } : {}),
        ...(normalizedSemester ? { semester: normalizedSemester } : {}),
        source: 'academic-registry-sync',
      };

      const existingResult = await client.query(
        'SELECT id FROM modules WHERE upper(code) = upper($1) LIMIT 1',
        [code]
      );

      if (existingResult.rowCount > 0) {
        await client.query(
          `UPDATE modules
             SET code = $2,
                 name = $3,
                 batch_size = $4,
                 day_type = $5,
                 credits = $6,
                 lectures_per_week = $7,
                 details = $8,
                 academic_year = $9,
                 semester = $10,
                 created_by = COALESCE(created_by, $11)
           WHERE id = $1`,
          [
            existingResult.rows[0].id,
            code,
            name,
            Number.isFinite(batchSize) ? batchSize : null,
            dayType,
            Number.isFinite(credits) ? credits : null,
            Number.isFinite(lecturesPerWeek) ? lecturesPerWeek : null,
            JSON.stringify(details),
            normalizedAcademicYear,
            normalizedSemester,
            req.user?.id || null,
          ]
        );
        updated += 1;
      } else {
        const generatedId = String(rawModule.id || `module_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`);
        await client.query(
          `INSERT INTO modules(id, code, name, batch_size, day_type, credits, lectures_per_week, details, lic_id, academic_year, semester, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10, $11)`,
          [
            generatedId,
            code,
            name,
            Number.isFinite(batchSize) ? batchSize : null,
            dayType,
            Number.isFinite(credits) ? credits : null,
            Number.isFinite(lecturesPerWeek) ? lecturesPerWeek : null,
            JSON.stringify(details),
            normalizedAcademicYear,
            normalizedSemester,
            req.user?.id || null,
          ]
        );
        inserted += 1;
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Module registry persisted to database',
      totalReceived: payloadModules.length,
      inserted,
      updated,
      skipped,
      totalProcessed: inserted + updated,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/timetables/:id', validatePositiveIntegerParam('id'), async (req, res) => {
  try {
    const roleKey = String(req.user?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!['facultycoordinator', 'admin'].includes(roleKey)) {
      return res.status(403).json({ success: false, error: 'Only Faculty Coordinator or Admin can delete timetables' });
    }
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM timetables WHERE id = $1', [id]);
    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }
    return res.json({ success: true, message: `Timetable #${id} deleted successfully`, deletedId: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
