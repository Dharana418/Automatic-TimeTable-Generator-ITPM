import antColonyScheduler from '../scheduler/antColonyScheduler.js';
import psoScheduler from '../scheduler/psoScheduler.js';
import hybridScheduler from '../scheduler/hybridScheduler.js';
import geneticScheduler from '../scheduler/geneticScheduler.js';
import tabuScheduler from '../scheduler/tabuScheduler.js';
import pool from '../config/db.js';

const allowedTypes = ['halls', 'modules', 'lics', 'instructors'];

export const addItem = async (req, res) => {
  try {
    const { type } = req.params; // halls, modules, lics, instructors
    const payload = req.body;
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const id = payload.id || `auto_${Date.now()}`;

    if (type === 'halls') {
      const { name = null, capacity = null, features = null } = payload;
      const { rows } = await pool.query(
        `INSERT INTO halls(id,name,capacity,features) VALUES($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, capacity=EXCLUDED.capacity, features=EXCLUDED.features RETURNING *`,
        [id, name, capacity, features ? JSON.stringify(features) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'modules') {
      const { code = null, name = null, credits = null, lectures_per_week = null, details = null, batch_size = null, day_type = null } = payload;
      const { rows } = await pool.query(
        `INSERT INTO modules(id,code,name,batch_size,day_type,credits,lectures_per_week,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, batch_size=EXCLUDED.batch_size, day_type=EXCLUDED.day_type, credits=EXCLUDED.credits, lectures_per_week=EXCLUDED.lectures_per_week, details=EXCLUDED.details RETURNING *`,
        [id, code, name, batch_size, day_type, credits, lectures_per_week, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'lics') {
      const { name = null, department = null, details = null } = payload;
      const { rows } = await pool.query(
        `INSERT INTO lics(id,name,department,details) VALUES($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, department=EXCLUDED.department, details=EXCLUDED.details RETURNING *`,
        [id, name, department, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'instructors') {
      const { name = null, email = null, department = null, availabilities = null, details = null } = payload;
      const { rows } = await pool.query(
        `INSERT INTO instructors(id,name,email,department,availabilities,details) VALUES($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, department=EXCLUDED.department, availabilities=EXCLUDED.availabilities, details=EXCLUDED.details RETURNING *`,
        [id, name, email, department, availabilities ? JSON.stringify(availabilities) : null, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    return res.status(400).json({ error: 'Unhandled type' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listItems = async (req, res) => {
  try {
    const { type } = req.params;
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }
    const { rows } = await pool.query(`SELECT * FROM ${type} ORDER BY created_at DESC`);
    return res.json({ success: true, items: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const payload = req.body || {};

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Item id is required' });
    }

    if (type === 'halls') {
      const { name = null, capacity = null, features = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE halls SET name=$1, capacity=$2, features=$3 WHERE id=$4 RETURNING *`,
        [name, capacity, features ? JSON.stringify(features) : null, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    if (type === 'modules') {
      const { code = null, name = null, credits = null, lectures_per_week = null, details = null, batch_size = null, day_type = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE modules SET code=$1, name=$2, batch_size=$3, day_type=$4, credits=$5, lectures_per_week=$6, details=$7 WHERE id=$8 RETURNING *`,
        [code, name, batch_size, day_type, credits, lectures_per_week, details ? JSON.stringify(details) : null, id]
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
      const { name = null, email = null, department = null, availabilities = null, details = null } = payload;
      const { rows, rowCount } = await pool.query(
        `UPDATE instructors SET name=$1, email=$2, department=$3, availabilities=$4, details=$5 WHERE id=$6 RETURNING *`,
        [name, email, department, availabilities ? JSON.stringify(availabilities) : null, details ? JSON.stringify(details) : null, id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Item not found' });
      return res.json({ success: true, item: rows[0] });
    }

    return res.status(400).json({ error: 'Unhandled type' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Item id is required' });
    }

    const { rowCount } = await pool.query(`DELETE FROM ${type} WHERE id=$1`, [id]);
    if (!rowCount) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getLicsWithInstructors = async (req, res) => {
  try {
    const q = `
      SELECT l.*, COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS instructors
      FROM lics l
      LEFT JOIN instructors i ON i.department = l.department
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
    const { rows } = await pool.query(q);
    return res.json({ success: true, items: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const createModuleAssignment = async (req, res) => {
  try {
    const {
      moduleId,
      lecturerId,
      licId,
      academicYear,
      semester = null,
    } = req.body;

    if (!moduleId || !lecturerId || !licId || !academicYear) {
      return res.status(400).json({ error: 'moduleId, lecturerId, licId and academicYear are required' });
    }

    const id = `asg_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const { rows } = await pool.query(
      `INSERT INTO module_assignments(id,module_id,lecturer_id,lic_id,academic_year,semester)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT (module_id, lecturer_id, lic_id, academic_year, semester)
       DO NOTHING
       RETURNING *`,
      [id, moduleId, lecturerId, licId, academicYear, semester]
    );

    if (!rows[0]) {
      return res.status(409).json({ error: 'Assignment already exists' });
    }

    return res.status(201).json({ success: true, item: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listModuleAssignments = async (req, res) => {
  try {
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
      ORDER BY ma.created_at DESC
    `;
    const { rows } = await pool.query(q);
    return res.json({ success: true, items: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteModuleAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM module_assignments WHERE id = $1', [id]);
    if (!rowCount) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateModuleAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      moduleId,
      lecturerId,
      licId,
      academicYear,
      semester = null,
    } = req.body;

    if (!moduleId || !lecturerId || !licId || !academicYear) {
      return res.status(400).json({ error: 'moduleId, lecturerId, licId and academicYear are required' });
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE module_assignments
       SET module_id=$1, lecturer_id=$2, lic_id=$3, academic_year=$4, semester=$5
       WHERE id=$6
       RETURNING *`,
      [moduleId, lecturerId, licId, academicYear, semester, id]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    return res.json({ success: true, item: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Assignment already exists' });
    }
    return res.status(500).json({ error: err.message });
  }
};


export const resetData = async (req, res) => {
  try {
    await pool.query('TRUNCATE module_assignments, halls, modules, lics, instructors');
    return res.json({ success: true, message: 'Tables truncated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Run scheduler endpoint. Accepts body: { algorithms: ['pso','ant','genetic','hybrid'], options: {...} }
export const runScheduler = async (req, res) => {
  try {
    const { algorithms = ['hybrid'], options = {} } = req.body;
    const normalizedAlgorithms = (algorithms || []).map((a) => String(a || '').toLowerCase());

    // gather data from DB
    const hallsRes = await pool.query('SELECT * FROM halls');
    const modulesRes = await pool.query('SELECT * FROM modules');
    const licsRes = await pool.query('SELECT * FROM lics');
    const instructorsRes = await pool.query('SELECT * FROM instructors');

    const halls = hallsRes.rows;
    const modules = modulesRes.rows;
    const lics = licsRes.rows;
    const instructors = instructorsRes.rows;

    if (!halls.length) {
      return res.status(400).json({
        error: 'No halls available. Please add halls before running the scheduler engine.',
      });
    }

    const constraints = { halls, modules, lics, instructors, options };

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

    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
