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

export const resetData = async (req, res) => {
  try {
    await pool.query('TRUNCATE halls, modules, lics, instructors');
    return res.json({ success: true, message: 'Tables truncated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Run scheduler endpoint. Accepts body: { algorithms: ['pso','ant','genetic','hybrid'], options: {...} }
export const runScheduler = async (req, res) => {
  try {
    const { algorithms = ['hybrid'], options = {} } = req.body;

    // gather data from DB
    const hallsRes = await pool.query('SELECT * FROM halls');
    const modulesRes = await pool.query('SELECT * FROM modules');
    const licsRes = await pool.query('SELECT * FROM lics');
    const instructorsRes = await pool.query('SELECT * FROM instructors');

    const halls = hallsRes.rows;
    const modules = modulesRes.rows;
    const lics = licsRes.rows;
    const instructors = instructorsRes.rows;

    const constraints = { halls, modules, lics, instructors, options };

    const results = {};

    if (algorithms.includes('pso')) {
      results.pso = psoScheduler(constraints);
    }
    if (algorithms.includes('ant') || algorithms.includes('antcolony')) {
      results.ant = antColonyScheduler(constraints);
    }
    if (algorithms.includes('genetic')) {
      results.genetic = geneticScheduler(constraints);
    }
    if (algorithms.includes('hybrid')) {
      results.hybrid = hybridScheduler(constraints);
    }
    if (algorithms.includes('tabu') || algorithms.includes('tabusearch')) {
      results.tabu = tabuScheduler(constraints, options);
    }

    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
