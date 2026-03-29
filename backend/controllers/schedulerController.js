import antColonyScheduler from '../scheduler/antColonyScheduler.js';
import psoScheduler from '../scheduler/psoScheduler.js';
import hybridScheduler from '../scheduler/hybridScheduler.js';
import geneticScheduler from '../scheduler/geneticScheduler.js';
import tabuScheduler from '../scheduler/tabuScheduler.js';
import pool from '../config/db.js';

const allowedTypes = ['halls', 'modules', 'lics', 'instructors', 'departments', 'batches'];

const ENGINEERING_SPECIALIZATIONS = new Set(['CS', 'ISE', 'CSNE', 'IM']);

const normalizeAlgorithmKey = (value) => String(value || '').trim().toLowerCase();
const normalizeRole = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const HALL_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/;
const HALL_TEXT_REGEX = /^[A-Za-z0-9][A-Za-z0-9 .,&()\/-]{1,79}$/;
const ALLOWED_HALL_AMENITIES = new Set([
  'projector',
  'wifi',
  'ac',
  'lab_equipment',
  'accessibility',
  'whiteboard',
  'sound_system',
]);
const ALLOWED_HALL_STATUSES = new Set(['available', 'occupied', 'maintenance', 'unavailable']);

const normalizeHallStatus = (status) => {
  const normalizedStatus = String(status || 'available').trim().toLowerCase();
  return ALLOWED_HALL_STATUSES.has(normalizedStatus) ? normalizedStatus : null;
};

const validateHallMaintenanceDates = ({ maintenanceStart = '', maintenanceEnd = '' } = {}) => {
  const normalizedStart = String(maintenanceStart || '').trim();
  const normalizedEnd = String(maintenanceEnd || '').trim();

  if ((normalizedStart && !normalizedEnd) || (!normalizedStart && normalizedEnd)) {
    return 'Please provide both maintenance start and end dates';
  }

  if (normalizedStart && normalizedEnd && normalizedEnd < normalizedStart) {
    return 'Maintenance end date must be on or after the start date';
  }

  return null;
};

const validateHallPayload = ({ id = '', name = '', capacity, features } = {}) => {
  const normalizedId = String(id || '').trim();
  const normalizedName = String(name || '').trim();

  if (!normalizedId || !HALL_ID_REGEX.test(normalizedId)) {
    return 'Hall id must be 2-40 characters and contain only letters, numbers, underscore, or hyphen';
  }

  if (!normalizedName || !HALL_TEXT_REGEX.test(normalizedName)) {
    return 'Hall name must be 2-80 characters and can include letters, numbers, spaces, and . , & ( ) / -';
  }

  const numericCapacity = Number(capacity);
  if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 2000) {
    return 'Hall capacity must be an integer between 1 and 2000';
  }

  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return 'Hall features must be a valid object';
  }

  const hallType = String(features.hallType || '').trim();
  const building = String(features.building || '').trim();
  const floor = features.floor == null ? '' : String(features.floor).trim();

  if (!hallType || hallType.length < 2 || hallType.length > 60) {
    return 'Hall type must be between 2 and 60 characters';
  }

  if (!building || building.length < 2 || building.length > 80) {
    return 'Building must be between 2 and 80 characters';
  }

  if (floor && floor.length > 30) {
    return 'Floor cannot exceed 30 characters';
  }

  if (features.amenities != null) {
    if (typeof features.amenities !== 'object' || Array.isArray(features.amenities)) {
      return 'Amenities must be a key/value object';
    }

    for (const [key, value] of Object.entries(features.amenities)) {
      if (!ALLOWED_HALL_AMENITIES.has(key)) {
        return `Unsupported amenity: ${key}`;
      }
      if (typeof value !== 'boolean') {
        return `Amenity '${key}' must be true or false`;
      }
    }
  }

  return null;
};

const isAcademicCoordinator = (user) => normalizeRole(user?.role) === 'academiccoordinator';
const isLic = (user) => normalizeRole(user?.role) === 'lic';
const isFacultyCoordinator = (user) => normalizeRole(user?.role) === 'facultycoordinator';
const isAdmin = (user) => normalizeRole(user?.role) === 'admin';
const isTeachingStaff = (user) => {
  const role = normalizeRole(user?.role);
  return ['instructor', 'professor', 'lecturer', 'assistantlecturer', 'seniorlecturer', 'lecturerseniorlecturer'].includes(role);
};

const parseBatchLabel = (name) => {
  const match = String(name || '').match(/^Y(\d+)\.S(\d+)\.(WE|WD)\.([A-Z0-9]+)\./i);
  if (!match) return null;

  const specialization = String(match[4]).toUpperCase();
  return {
    year: Number(match[1]),
    semester: Number(match[2]),
    dayType: String(match[3]).toUpperCase() === 'WE' ? 'weekend' : 'weekday',
    specialization,
    departmentGroup: ENGINEERING_SPECIALIZATIONS.has(specialization) ? 'Engineering' : specialization,
  };
};

const inferModuleSpecialization = (module) => {
  const code = String(module?.code || '').toUpperCase();
  if (code.startsWith('IT')) return 'IT';
  if (code.startsWith('SE')) return 'SE';
  if (code.startsWith('IE')) return 'Engineering';
  return 'General';
};

const inferModuleYear = (module) => {
  const code = String(module?.code || '').toUpperCase();
  const match = code.match(/^[A-Z]+(\d)/);
  return match ? Number(match[1]) : null;
};

const runSelectedAlgorithms = (constraints, algorithms, options) => {
  const normalizedAlgorithms = (algorithms || []).map(normalizeAlgorithmKey);
  const results = {};

  if (normalizedAlgorithms.includes('pso')) {
    results.pso = psoScheduler(constraints, options);
  }
  if (
    normalizedAlgorithms.includes('ant') ||
    normalizedAlgorithms.includes('antcolony') ||
    normalizedAlgorithms.includes('anticolony')
  ) {
    results.ant = antColonyScheduler(constraints, options);
  }
  if (normalizedAlgorithms.includes('genetic')) {
    results.genetic = geneticScheduler(constraints, options);
  }
  if (normalizedAlgorithms.includes('tabu') || normalizedAlgorithms.includes('tabusearch')) {
    results.tabu = tabuScheduler(constraints, options);
  }
  if (normalizedAlgorithms.includes('hybrid')) {
    results.hybrid = hybridScheduler(constraints, options);
  }

  return results;
};

const buildSemesterSpecializationSegments = ({ batches = [], modules = [], lics = [], instructors = [] }) => {
  const segmentMap = new Map();

  batches.forEach((batch) => {
    const parsed = parseBatchLabel(batch.name);
    if (!parsed) return;

    const key = `Y${parsed.year}.S${parsed.semester}.${parsed.specialization}`;
    const existing = segmentMap.get(key) || {
      key,
      year: parsed.year,
      semester: parsed.semester,
      specialization: parsed.specialization,
      departmentGroup: parsed.departmentGroup,
      dayTypeSet: new Set(),
      batches: [],
    };

    existing.dayTypeSet.add(parsed.dayType);
    existing.batches.push(batch);
    segmentMap.set(key, existing);
  });

  const segments = [];

  segmentMap.forEach((segment) => {
    const modulesForSegment = modules
      .filter((module) => {
        const moduleSpec = inferModuleSpecialization(module);
        const moduleYear = inferModuleYear(module);
        const specializationMatch =
          segment.departmentGroup === 'Engineering'
            ? moduleSpec === 'Engineering'
            : moduleSpec === segment.specialization;
        const yearMatch = moduleYear ? moduleYear === segment.year : true;
        return specializationMatch && yearMatch;
      })
      .map((module) => {
        const dayType = segment.dayTypeSet.size === 1 ? [...segment.dayTypeSet][0] : 'any';
        return {
          ...module,
          day_type: module.day_type || dayType,
        };
      });

    const licsForSegment = lics.filter((lic) => {
      const department = String(lic.department || '').toUpperCase();
      if (segment.departmentGroup === 'Engineering') {
        return ['ENGINEERING', 'CS', 'ISE', 'CSNE', 'IM'].some((value) => department.includes(value));
      }
      return department.includes(segment.specialization);
    });

    const instructorsForSegment = instructors.filter((instructor) => {
      const department = String(instructor.department || '').toUpperCase();
      if (segment.departmentGroup === 'Engineering') {
        return ['ENGINEERING', 'CS', 'ISE', 'CSNE', 'IM'].some((value) => department.includes(value));
      }
      return department.includes(segment.specialization);
    });

    segments.push({
      ...segment,
      dayTypes: [...segment.dayTypeSet],
      modules: modulesForSegment,
      lics: licsForSegment,
      instructors: instructorsForSegment,
      batchCount: segment.batches.length,
    });
  });

  segments.sort((left, right) => {
    if (left.year !== right.year) return left.year - right.year;
    if (left.semester !== right.semester) return left.semester - right.semester;
    return left.specialization.localeCompare(right.specialization);
  });

  return segments;
};

const resolveLicScope = async (user) => {
  if (!user?.id) return null;
  const { rows } = await pool.query(
    `SELECT id, name
     FROM lics
     WHERE details->>'user_id' = $1
        OR LOWER(name) = LOWER($2)
        OR LOWER(COALESCE(details->>'email', '')) = LOWER($3)
     ORDER BY created_at ASC
     LIMIT 1`,
    [user.id, user.name || '', user.email || '']
  );
  return rows[0] || null;
};

const resolveInstructorScope = async (user) => {
  if (!user?.id) return null;
  const { rows } = await pool.query(
    `SELECT id, name, email
     FROM instructors
     WHERE details->>'user_id' = $1
        OR LOWER(name) = LOWER($2)
        OR LOWER(COALESCE(email, details->>'email', '')) = LOWER($3)
     ORDER BY created_at ASC
     LIMIT 1`,
    [user.id, user.name || '', user.email || '']
  );
  return rows[0] || null;
};

const loadSoftConstraintsForUser = async (userId) => {
  if (!userId) return null;
  const { rows } = await pool.query(
    `SELECT preferred_days, preferred_time_slots, w5_weight, notes
     FROM faculty_soft_constraints
     WHERE coordinator_id = $1
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const withFacultySoftConstraints = async (user, options = {}) => {
  if (!isFacultyCoordinator(user)) return { ...options };

  const soft = await loadSoftConstraintsForUser(user.id);
  if (!soft) return { ...options };

  return {
    ...options,
    softConstraints: {
      preferredDays: soft.preferred_days || [],
      preferredTimeSlots: soft.preferred_time_slots || [],
    },
    weights: {
      ...(options.weights || {}),
      ...(soft.w5_weight != null ? { w5: Number(soft.w5_weight) } : {}),
    },
  };
};

export const addItem = async (req, res) => {
  try {
    const { type } = req.params;
    const payload = req.body || {};

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const id = payload.id || `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    if (type === 'halls') {
      if (!isAcademicCoordinator(req.user)) {
        return res.status(403).json({ error: 'Only Academic Coordinator can add hall structures' });
      }

      const {
        name = null,
        capacity = null,
        features = null,
        status = 'available',
        maintenanceStart = null,
        maintenanceEnd = null,
      } = payload;
      const hallValidationError = validateHallPayload({ id, name, capacity, features });
      if (hallValidationError) {
        return res.status(400).json({ error: hallValidationError });
      }

      const normalizedStatus = normalizeHallStatus(status);
      if (!normalizedStatus) {
        return res.status(400).json({ error: 'Invalid hall status value' });
      }

      const maintenanceValidationError = validateHallMaintenanceDates({ maintenanceStart, maintenanceEnd });
      if (maintenanceValidationError) {
        return res.status(400).json({ error: maintenanceValidationError });
      }

      const normalizedMaintenanceStart = String(maintenanceStart || '').trim() || null;
      const normalizedMaintenanceEnd = String(maintenanceEnd || '').trim() || null;

      if (normalizedStatus === 'maintenance' && (!normalizedMaintenanceStart || !normalizedMaintenanceEnd)) {
        return res.status(400).json({ error: 'Maintenance start and end dates are required for maintenance status' });
      }

      const { rows } = await pool.query(
        `INSERT INTO halls(id, name, capacity, features, status, maintenance_start, maintenance_end)
         VALUES($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           capacity = EXCLUDED.capacity,
           features = EXCLUDED.features,
           status = EXCLUDED.status,
           maintenance_start = EXCLUDED.maintenance_start,
           maintenance_end = EXCLUDED.maintenance_end
         RETURNING id, name, capacity, features, status,
                   maintenance_start AS "maintenanceStart",
                   maintenance_end AS "maintenanceEnd",
                   created_at`,
        [
          id,
          name,
          capacity,
          features ? JSON.stringify(features) : null,
          normalizedStatus,
          normalizedStatus === 'maintenance' ? normalizedMaintenanceStart : null,
          normalizedStatus === 'maintenance' ? normalizedMaintenanceEnd : null,
        ]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'modules') {
      let licId = payload.lic_id || null;
      if (isLic(req.user)) {
        const licScope = await resolveLicScope(req.user);
        if (!licScope) {
          return res.status(403).json({
            error: 'LIC profile not found. Ask Academic Coordinator to create a matching LIC record for your account.',
          });
        }
        licId = licScope.id;
      }

      const {
        code = null,
        name = null,
        credits = null,
        lectures_per_week = null,
        details = null,
        batch_size = null,
        day_type = null,
      } = payload;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          error: 'Module code and name are required',
          received: { code, name },
        });
      }

      const existing = await pool.query('SELECT id, code, name FROM modules WHERE code = $1', [code]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Module with code '${code}' already exists`,
          existing: existing.rows[0],
        });
      }

      const { rows } = await pool.query(
        `INSERT INTO modules(id, code, name, batch_size, day_type, credits, lectures_per_week, details, lic_id)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          id,
          code,
          name,
          batch_size || null,
          day_type || null,
          credits || null,
          lectures_per_week || null,
          details ? JSON.stringify(details) : null,
          licId,
        ]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'lics') {
      if (!isAcademicCoordinator(req.user)) {
        return res.status(403).json({ error: 'Only Academic Coordinator can create LIC records' });
      }

      const { name = null, department = null, details = null } = payload;
      if (!name) return res.status(400).json({ error: 'LIC name is required' });

      const { rows } = await pool.query(
        `INSERT INTO lics(id, name, department, details)
         VALUES($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           department = EXCLUDED.department,
           details = EXCLUDED.details
         RETURNING *`,
        [id, name, department, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'instructors') {
      let licId = payload.lic_id || null;
      if (isLic(req.user)) {
        const licScope = await resolveLicScope(req.user);
        if (!licScope) {
          return res.status(403).json({
            error: 'LIC profile not found. Ask Academic Coordinator to create a matching LIC record for your account.',
          });
        }
        licId = licScope.id;
      }

      const { name = null, email = null, department = null, availabilities = null, details = null } = payload;
      if (!name) return res.status(400).json({ error: 'Instructor name is required' });

      const { rows } = await pool.query(
        `INSERT INTO instructors(id, name, email, department, availabilities, details, lic_id)
         VALUES($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           department = EXCLUDED.department,
           availabilities = EXCLUDED.availabilities,
           details = EXCLUDED.details,
           lic_id = EXCLUDED.lic_id
         RETURNING *`,
        [
          id,
          name,
          email,
          department,
          availabilities ? JSON.stringify(availabilities) : null,
          details ? JSON.stringify(details) : null,
          licId,
        ]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'departments') {
      const { code = null, name = null } = payload;
      if (!name) return res.status(400).json({ error: 'Department name is required' });

      const { rows } = await pool.query(
        `INSERT INTO departments(id, code, name)
         VALUES($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name
         RETURNING *`,
        [id, code, name]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'batches') {
      const { name = null, department_id = null, capacity = null } = payload;
      if (!name) return res.status(400).json({ error: 'Batch name is required' });

      const { rows } = await pool.query(
        `INSERT INTO batches(id, name, department_id, capacity)
         VALUES($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           department_id = EXCLUDED.department_id,
           capacity = EXCLUDED.capacity
         RETURNING *`,
        [id, name, department_id, capacity]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    return res.status(400).json({ error: 'Unhandled type' });
  } catch (err) {
    console.error(`Error adding ${req.params.type}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

export const listItems = async (req, res) => {
  try {
    const { type } = req.params;
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    if (isLic(req.user) && ['instructors', 'modules'].includes(type)) {
      const licScope = await resolveLicScope(req.user);
      if (!licScope) return res.json({ success: true, items: [] });

      const { rows } = await pool.query(
        `SELECT * FROM ${type} WHERE lic_id = $1 ORDER BY created_at DESC`,
        [licScope.id]
      );
      return res.json({ success: true, items: rows });
    }

    if (type === 'halls') {
      const { rows } = await pool.query(
        `SELECT id, name, capacity, features, status,
                maintenance_start AS "maintenanceStart",
                maintenance_end AS "maintenanceEnd",
                created_at
         FROM halls
         ORDER BY created_at DESC`
      );
      return res.json({ success: true, items: rows });
    }

    const { rows } = await pool.query(`SELECT * FROM ${type} ORDER BY created_at DESC`);
    return res.json({ success: true, items: rows });
  } catch (err) {
    console.error(`Error listing ${req.params.type}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const { rowCount } = await pool.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: 'Item not found' });

    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting ${req.params.type}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const payload = req.body || {};

    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid data type' });
    if (!id) return res.status(400).json({ error: 'Item id is required' });

    if (type === 'halls') {
      const {
        id: nextId = id,
        name = null,
        capacity = null,
        features = null,
        status = 'available',
        maintenanceStart = null,
        maintenanceEnd = null,
      } = payload;
      const hallValidationError = validateHallPayload({ id: nextId, name, capacity, features });
      if (hallValidationError) {
        return res.status(400).json({ error: hallValidationError });
      }

      const normalizedStatus = normalizeHallStatus(status);
      if (!normalizedStatus) {
        return res.status(400).json({ error: 'Invalid hall status value' });
      }

      const maintenanceValidationError = validateHallMaintenanceDates({ maintenanceStart, maintenanceEnd });
      if (maintenanceValidationError) {
        return res.status(400).json({ error: maintenanceValidationError });
      }

      const normalizedMaintenanceStart = String(maintenanceStart || '').trim() || null;
      const normalizedMaintenanceEnd = String(maintenanceEnd || '').trim() || null;

      if (normalizedStatus === 'maintenance' && (!normalizedMaintenanceStart || !normalizedMaintenanceEnd)) {
        return res.status(400).json({ error: 'Maintenance start and end dates are required for maintenance status' });
      }

      const { rows, rowCount } = await pool.query(
        `UPDATE halls
         SET id=$1,
             name=$2,
             capacity=$3,
             features=$4,
             status=$5,
             maintenance_start=$6,
             maintenance_end=$7
         WHERE id=$8
         RETURNING id, name, capacity, features, status,
                   maintenance_start AS "maintenanceStart",
                   maintenance_end AS "maintenanceEnd",
                   created_at`,
        [
          String(nextId || '').trim(),
          name,
          capacity,
          features ? JSON.stringify(features) : null,
          normalizedStatus,
          normalizedStatus === 'maintenance' ? normalizedMaintenanceStart : null,
          normalizedStatus === 'maintenance' ? normalizedMaintenanceEnd : null,
          id,
        ]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'modules') {
      const { code = null, name = null, credits = null, lectures_per_week = null, details = null, batch_size = null, day_type = null, lic_id = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE modules SET code=$1, name=$2, batch_size=$3, day_type=$4, credits=$5, lectures_per_week=$6, details=$7, lic_id=$8 WHERE id=$9 RETURNING *`,
        [code, name, batch_size, day_type, credits, lectures_per_week, details ? JSON.stringify(details) : null, lic_id, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'lics') {
      const { name = null, department = null, details = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE lics SET name=$1, department=$2, details=$3 WHERE id=$4 RETURNING *`,
        [name, department, details ? JSON.stringify(details) : null, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'instructors') {
      const { name = null, email = null, department = null, availabilities = null, details = null, lic_id = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE instructors SET name=$1, email=$2, department=$3, availabilities=$4, details=$5, lic_id=$6 WHERE id=$7 RETURNING *`,
        [name, email, department, availabilities ? JSON.stringify(availabilities) : null, details ? JSON.stringify(details) : null, lic_id, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'departments') {
      const { code = null, name = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE departments SET code=$1, name=$2 WHERE id=$3 RETURNING *`,
        [code, name, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'batches') {
      const { name = null, department_id = null, capacity = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE batches SET name=$1, department_id=$2, capacity=$3 WHERE id=$4 RETURNING *`,
        [name, department_id, capacity, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    return res.status(400).json({ error: 'Unhandled type' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getLicsWithInstructors = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS instructors
      FROM lics l
      LEFT JOIN instructors i ON i.department = l.department
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    return res.json({ success: true, items: rows });
  } catch (err) {
    console.error('Error fetching LICs with instructors:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const createModuleAssignment = async (req, res) => {
  try {
    const { moduleId, lecturerId, licId, academicYear, semester = null } = req.body || {};

    if (!moduleId || !lecturerId || !academicYear) {
      return res.status(400).json({ error: 'moduleId, lecturerId and academicYear are required' });
    }

    let effectiveLicId = licId;
    if (isLic(req.user)) {
      const licScope = await resolveLicScope(req.user);
      if (!licScope) return res.status(403).json({ error: 'LIC profile not found for current user' });
      effectiveLicId = licScope.id;
    }

    if (!effectiveLicId) return res.status(400).json({ error: 'licId is required' });

    const id = `asg_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const { rows } = await pool.query(
      `INSERT INTO module_assignments(id, module_id, lecturer_id, lic_id, academic_year, semester)
       VALUES($1, $2, $3, $4, $5, $6)
       ON CONFLICT (module_id, lecturer_id, lic_id, academic_year, semester)
       DO NOTHING
       RETURNING *`,
      [id, moduleId, lecturerId, effectiveLicId, academicYear, semester]
    );

    if (!rows[0]) return res.status(409).json({ error: 'Assignment already exists' });
    return res.status(201).json({ success: true, item: rows[0] });
  } catch (err) {
    console.error('Error creating module assignment:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const listModuleAssignments = async (req, res) => {
  try {
    let filterSql = '';
    const params = [];

    if (isLic(req.user)) {
      const licScope = await resolveLicScope(req.user);
      if (!licScope) return res.json({ success: true, items: [] });
      filterSql = 'WHERE ma.lic_id = $1';
      params.push(licScope.id);
    } else if (isTeachingStaff(req.user) && !isAdmin(req.user) && !isAcademicCoordinator(req.user) && !isFacultyCoordinator(req.user)) {
      const instructorScope = await resolveInstructorScope(req.user);
      if (!instructorScope) return res.json({ success: true, items: [] });
      filterSql = 'WHERE ma.lecturer_id = $1';
      params.push(instructorScope.id);
    }

    const q = `
      SELECT
        ma.id,
        ma.module_id,
        ma.lecturer_id,
        ma.lic_id,
        ma.academic_year,
        ma.semester,
        ma.created_at,
        m.code AS module_code,
        m.name AS module_name,
        i.name AS lecturer_name,
        l.name AS lic_name
      FROM module_assignments ma
      LEFT JOIN modules m ON m.id = ma.module_id
      LEFT JOIN instructors i ON i.id = ma.lecturer_id
      LEFT JOIN lics l ON l.id = ma.lic_id
      ${filterSql}
      ORDER BY ma.created_at DESC
    `;

    const { rows } = await pool.query(q, params);
    return res.json({ success: true, items: rows });
  } catch (err) {
    console.error('Error listing module assignments:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateModuleAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { lecturerId = null, licId = null, semester = null, academicYear = null } = req.body || {};

    if (!id) return res.status(400).json({ error: 'Assignment id is required' });

    const currentRes = await pool.query('SELECT * FROM module_assignments WHERE id = $1', [id]);
    if (!currentRes.rows.length) return res.status(404).json({ error: 'Assignment not found' });
    const current = currentRes.rows[0];

    if (isLic(req.user)) {
      const licScope = await resolveLicScope(req.user);
      if (!licScope || current.lic_id !== licScope.id) {
        return res.status(403).json({ error: 'Not allowed to update this assignment' });
      }
    }

    const targetLicId = licId || current.lic_id;
    const { rows } = await pool.query(
      `UPDATE module_assignments
       SET lecturer_id = $1,
           lic_id = $2,
           semester = $3,
           academic_year = $4
       WHERE id = $5
       RETURNING *`,
      [
        lecturerId || current.lecturer_id,
        targetLicId,
        semester || current.semester,
        academicYear || current.academic_year,
        id,
      ]
    );

    return res.json({ success: true, item: rows[0] });
  } catch (err) {
    console.error('Error updating module assignment:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteModuleAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (isLic(req.user)) {
      const licScope = await resolveLicScope(req.user);
      if (!licScope) return res.status(403).json({ error: 'LIC profile not found for current user' });

      const { rowCount } = await pool.query(
        'DELETE FROM module_assignments WHERE id = $1 AND lic_id = $2',
        [id, licScope.id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Assignment not found' });
      return res.json({ success: true });
    }

    const { rowCount } = await pool.query('DELETE FROM module_assignments WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Assignment not found' });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting module assignment:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const upsertSoftConstraints = async (req, res) => {
  try {
    if (!isFacultyCoordinator(req.user)) {
      return res.status(403).json({ error: 'Only Faculty Coordinator can manage soft constraints' });
    }

    const { preferredDays = [], preferredTimeSlots = [], w5Weight = null, notes = null } = req.body || {};

    const { rows } = await pool.query(
      `INSERT INTO faculty_soft_constraints(
         coordinator_id,
         preferred_days,
         preferred_time_slots,
         w5_weight,
         notes,
         created_at,
         updated_at
       )
       VALUES($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (coordinator_id)
       DO UPDATE SET
         preferred_days = EXCLUDED.preferred_days,
         preferred_time_slots = EXCLUDED.preferred_time_slots,
         w5_weight = EXCLUDED.w5_weight,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, preferredDays, preferredTimeSlots, w5Weight, notes]
    );

    return res.json({
      success: true,
      item: rows[0],
      mapping: {
        fitnessComponent: 'w5',
        appliedWeight: rows[0].w5_weight,
      },
    });
  } catch (err) {
    console.error('Error saving soft constraints:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getSoftConstraints = async (req, res) => {
  try {
    if (!isFacultyCoordinator(req.user)) {
      return res.status(403).json({ error: 'Only Faculty Coordinator can view soft constraints' });
    }

    const row = await loadSoftConstraintsForUser(req.user.id);
    return res.json({ success: true, item: row || null });
  } catch (err) {
    console.error('Error loading soft constraints:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getLicDailyTimetable = async (req, res) => {
  try {
    if (!isLic(req.user)) {
      return res.status(403).json({ error: 'Only LIC can access this timetable view' });
    }

    const licScope = await resolveLicScope(req.user);
    if (!licScope) {
      return res.status(404).json({ error: 'LIC profile not found for current user' });
    }

    const requestedDay = String(req.query.day || '').trim();
    const queryParams = [licScope.id];
    let dayFilter = '';

    if (requestedDay) {
      queryParams.push(requestedDay);
      dayFilter = 'AND lower(s.day_name) = lower($2)';
    }

    const sql = `
      WITH latest_timetable AS (
        SELECT t.id, t.data
        FROM timetables t
        WHERE t.data IS NOT NULL
        ORDER BY t.created_at DESC
        LIMIT 1
      ), schedule_rows AS (
        SELECT
          elem->>'moduleId' AS module_id,
          elem->>'instructorId' AS instructor_id,
          elem->>'hallId' AS hall_id,
          elem->>'day' AS day_name,
          COALESCE(elem->>'slot', (elem->'slots'->>0)) AS start_slot,
          elem->'slots' AS slots_json
        FROM latest_timetable lt,
             LATERAL jsonb_array_elements(
               CASE
                 WHEN jsonb_typeof(lt.data->'schedule') = 'array' THEN lt.data->'schedule'
                 ELSE '[]'::jsonb
               END
             ) elem
      )
      SELECT
        s.day_name,
        s.start_slot,
        COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(s.slots_json)), ', '), s.start_slot) AS slots,
        m.code AS course_code,
        m.name AS course_name,
        CASE
          WHEN COALESCE(lower(m.details->>'roomType'), '') LIKE '%lab%' OR lower(m.name) LIKE '%lab%'
            THEN 'Lab'
          ELSE 'Course'
        END AS session_type,
        h.name AS room_name,
        h.capacity AS room_capacity,
        i.name AS instructor_name,
        l.name AS lic_name
      FROM schedule_rows s
      JOIN modules m ON m.id::text = s.module_id
      LEFT JOIN halls h ON h.id::text = s.hall_id
      LEFT JOIN instructors i ON i.id::text = s.instructor_id
      LEFT JOIN lics l ON l.id = i.lic_id
      WHERE i.lic_id = $1
      ${dayFilter}
      ORDER BY
        CASE lower(s.day_name)
          WHEN 'mon' THEN 1
          WHEN 'tue' THEN 2
          WHEN 'wed' THEN 3
          WHEN 'thu' THEN 4
          WHEN 'fri' THEN 5
          WHEN 'sat' THEN 6
          WHEN 'sun' THEN 7
          ELSE 8
        END,
        s.start_slot
    `;

    const { rows } = await pool.query(sql, queryParams);

    return res.json({
      success: true,
      lic: { id: licScope.id, name: licScope.name },
      day: requestedDay || 'all',
      items: rows,
      sql,
    });
  } catch (err) {
    console.error('Error fetching LIC daily timetable:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const resetData = async (req, res) => {
  try {
    await pool.query('TRUNCATE module_assignments, halls, modules, lics, instructors, batches, departments CASCADE');
    return res.json({ success: true, message: 'Tables truncated' });
  } catch (err) {
    console.error('Error resetting data:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const runScheduler = async (req, res) => {
  try {
    const { algorithms = ['hybrid'], options = {} } = req.body;

    const [hallsRes, modulesRes, licsRes, instructorsRes, batchesRes] = await Promise.all([
      pool.query('SELECT * FROM halls'),
      pool.query('SELECT * FROM modules'),
      pool.query('SELECT * FROM lics'),
      pool.query('SELECT * FROM instructors'),
      pool.query('SELECT * FROM batches'),
    ]);

    const halls = hallsRes.rows;
    const modules = modulesRes.rows;
    const lics = licsRes.rows;
    const instructors = instructorsRes.rows;
    const batches = batchesRes.rows;

    if (!halls.length) {
      return res.status(400).json({ error: 'No halls available. Please add halls before running the scheduler engine.' });
    }

    const mergedOptions = await withFacultySoftConstraints(req.user, options);
    const constraints = { halls, modules, lics, instructors, batches, options: mergedOptions };
    const results = runSelectedAlgorithms(constraints, algorithms, mergedOptions);

    return res.json({ success: true, results });
  } catch (err) {
    console.error('Error running scheduler:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const runSchedulerBySegments = async (req, res) => {
  try {
    const { algorithms = ['hybrid'], options = {} } = req.body;

    const [hallsRes, modulesRes, licsRes, instructorsRes, batchesRes] = await Promise.all([
      pool.query('SELECT * FROM halls'),
      pool.query('SELECT * FROM modules'),
      pool.query('SELECT * FROM lics'),
      pool.query('SELECT * FROM instructors'),
      pool.query('SELECT * FROM batches'),
    ]);

    const halls = hallsRes.rows;
    const modules = modulesRes.rows;
    const lics = licsRes.rows;
    const instructors = instructorsRes.rows;
    const batches = batchesRes.rows;

    if (!halls.length) {
      return res.status(400).json({ error: 'No halls available. Please add halls before running the scheduler engine.' });
    }

    if (!batches.length) {
      return res.status(400).json({ error: 'No batches available. Please add batches before running segmented scheduling.' });
    }

    const mergedOptions = await withFacultySoftConstraints(req.user, options);
    const segments = buildSemesterSpecializationSegments({ batches, modules, lics, instructors });
    const segmentedResults = [];

    for (const segment of segments) {
      const constraints = {
        halls,
        modules: segment.modules,
        lics: segment.lics,
        instructors: segment.instructors,
        batches: segment.batches,
        options: {
          ...mergedOptions,
          segmentKey: segment.key,
          year: segment.year,
          semester: segment.semester,
          specialization: segment.specialization,
          departmentGroup: segment.departmentGroup,
        },
      };

      const results = runSelectedAlgorithms(constraints, algorithms, constraints.options);
      segmentedResults.push({
        segment: {
          key: segment.key,
          year: segment.year,
          semester: segment.semester,
          specialization: segment.specialization,
          departmentGroup: segment.departmentGroup,
          dayTypes: segment.dayTypes,
          batchCount: segment.batchCount,
          moduleCount: segment.modules.length,
          instructorCount: segment.instructors.length,
          licCount: segment.lics.length,
        },
        results,
      });
    }

    return res.json({
      success: true,
      totalSegments: segmentedResults.length,
      segmentedResults,
    });
  } catch (err) {
    console.error('Error running segmented scheduler:', err);
    return res.status(500).json({ error: err.message });
  }
};
