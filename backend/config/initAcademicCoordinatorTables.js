import pool from './db.js';

export async function initAcademicCoordinatorTables() {
  try {
    // Timetable approvals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetable_approvals (
        id SERIAL PRIMARY KEY,
        timetable_id INTEGER,
        coordinator_id UUID REFERENCES users(id),
        status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
        comments TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scheduling conflicts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduling_conflicts (
        id SERIAL PRIMARY KEY,
        timetable_id INTEGER,
        conflict_type VARCHAR(100),
        description TEXT,
        severity VARCHAR(50) CHECK (severity IN ('high', 'medium', 'low')),
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id),
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Academic calendar table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS academic_calendar (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255),
        event_type VARCHAR(100) CHECK (event_type IN ('semester_start', 'semester_end', 'exam_period', 'holiday', 'special_event')),
        start_date DATE,
        end_date DATE,
        academic_year VARCHAR(20),
        semester VARCHAR(20),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Timetable table (if not exists)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        semester VARCHAR(20),
        year VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        generated_by UUID REFERENCES users(id),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Academic Coordinator tables created successfully');
  } catch (err) {
    console.error('Error creating academic coordinator tables:', err);
    throw err;
  }
}