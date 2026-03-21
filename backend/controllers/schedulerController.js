import antColonyScheduler from '../scheduler/antColonyScheduler.js';
import psoScheduler from '../scheduler/psoScheduler.js';
import hybridScheduler from '../scheduler/hybridScheduler.js';
import geneticScheduler from '../scheduler/geneticScheduler.js';
import tabuScheduler from '../scheduler/tabuScheduler.js';
import pool from '../config/db.js';

const allowedTypes = ['halls', 'modules', 'lics', 'instructors'];

export const addItem = async (req, res) => {
  try {
    const { type } = req.params;
    const payload = req.body;
    
    console.log(`📝 Adding item to ${type}:`, payload);
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const id = payload.id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (type === 'halls') {
      const { name = null, capacity = null, features = null } = payload;
      const { rows } = await pool.query(
        `INSERT INTO halls(id, name, capacity, features) 
         VALUES($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           capacity = EXCLUDED.capacity, 
           features = EXCLUDED.features 
         RETURNING *`,
        [id, name, capacity, features ? JSON.stringify(features) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'modules') {
      const { 
        code = null, 
        name = null, 
        credits = null, 
        lectures_per_week = null, 
        details = null, 
        batch_size = null, 
        day_type = null 
      } = payload;
      
      // Validate required fields
      if (!code || !name) {
        return res.status(400).json({ 
          success: false,
          error: 'Module code and name are required',
          received: { code, name }
        });
      }
      
      console.log('📚 Adding module:', { code, name, credits, lectures_per_week });
      
      // Check if module with same code already exists
      const existing = await pool.query(
        'SELECT id, code, name FROM modules WHERE code = $1',
        [code]
      );
      
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Module with code '${code}' already exists`,
          existing: existing.rows[0]
        });
      }
      
      const { rows } = await pool.query(
        `INSERT INTO modules(id, code, name, batch_size, day_type, credits, lectures_per_week, details) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, code, name, batch_size || null, day_type || null, credits || null, lectures_per_week || null, details ? JSON.stringify(details) : null]
      );
      
      console.log('✅ Module added successfully:', rows[0]);
      return res.status(201).json({ success: true, item: rows[0] });
    }

    if (type === 'lics') {
      const { name = null, department = null, details = null } = payload;
      
      if (!name) {
        return res.status(400).json({ error: 'LIC name is required' });
      }
      
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
      const { name = null, email = null, department = null, availabilities = null, details = null } = payload;
      
      if (!name) {
        return res.status(400).json({ error: 'Instructor name is required' });
      }
      
      const { rows } = await pool.query(
        `INSERT INTO instructors(id, name, email, department, availabilities, details) 
         VALUES($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           email = EXCLUDED.email, 
           department = EXCLUDED.department, 
           availabilities = EXCLUDED.availabilities, 
           details = EXCLUDED.details 
         RETURNING *`,
        [id, name, email, department, availabilities ? JSON.stringify(availabilities) : null, details ? JSON.stringify(details) : null]
      );
      return res.status(201).json({ success: true, item: rows[0] });
    }

    return res.status(400).json({ error: 'Unhandled type' });
  } catch (err) {
    console.error(`❌ Error adding ${req.params.type}:`, err);
    return res.status(500).json({ 
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting ${req.params.type}:`, err);
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
    console.error('Error fetching LICs with instructors:', err);
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
      `INSERT INTO module_assignments(id, module_id, lecturer_id, lic_id, academic_year, semester)
       VALUES($1, $2, $3, $4, $5, $6)
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
    console.error('Error creating module assignment:', err);
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
    console.error('Error listing module assignments:', err);
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
    console.error('Error deleting module assignment:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const resetData = async (req, res) => {
  try {
    await pool.query('TRUNCATE module_assignments, halls, modules, lics, instructors CASCADE');
    return res.json({ success: true, message: 'Tables truncated' });
  } catch (err) {
    console.error('Error resetting data:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Run scheduler endpoint
export const runScheduler = async (req, res) => {
  try {
    const { algorithms = ['hybrid'], options = {} } = req.body;

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
    console.error('Error running scheduler:', err);
    return res.status(500).json({ error: err.message });
  }
};