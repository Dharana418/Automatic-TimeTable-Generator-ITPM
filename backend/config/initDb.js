import pool from './db.js';

export async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS halls (
        id TEXT PRIMARY KEY,
        name TEXT,
        capacity INTEGER,
        features JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT,
        batch_size INTEGER,
        day_type TEXT,
        credits INTEGER,
        lectures_per_week INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create lics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lics (
        id TEXT PRIMARY KEY,
        name TEXT,
        department TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create instructors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instructors (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        department TEXT,
        availabilities JSONB,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table (for auth) if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        address TEXT,
        birthday DATE,
        phonenumber TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Scheduler tables ensured');
    // Ensure new columns exist on modules (for schema updates)
    await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS batch_size INTEGER`);
    await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS day_type TEXT`);
  } catch (err) {
    console.error('Error initializing DB tables:', err);
    throw err;
  }
}

export default initDb;

