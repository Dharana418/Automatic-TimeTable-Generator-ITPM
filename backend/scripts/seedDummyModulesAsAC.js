import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

dotenv.config();

const DUMMY_AC_EMAIL = process.env.SEED_AC_EMAIL || 'academic.coordinator@example.local';
const DUMMY_AC_NAME = process.env.SEED_AC_NAME || 'Seed Academic Coordinator';
const DUMMY_AC_PASSWORD = process.env.SEED_AC_PASSWORD || 'acpassword123!';

const modulesToSeed = [
  { code: 'IT101', name: 'Introduction to Information Technology', academic_year: 1, semester: 1, details: { specialization: 'IT', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'IT102', name: 'Computing Fundamentals', academic_year: 1, semester: 1, details: { specialization: 'IT', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'IT103', name: 'Intro to Programming', academic_year: 1, semester: 1, details: { specialization: 'IT', academic_year: 1, semester: 1 }, credits: 4, lectures_per_week: 3 },
  { code: 'IT121', name: 'Data Structures (Intro)', academic_year: 1, semester: 2, details: { specialization: 'IT', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'IT122', name: 'Digital Systems', academic_year: 1, semester: 2, details: { specialization: 'IT', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'IT123', name: 'Web Foundations', academic_year: 1, semester: 2, details: { specialization: 'IT', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'SE101', name: 'Software Engineering Fundamentals', academic_year: 1, semester: 1, details: { specialization: 'SE', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'SE102', name: 'Programming for Software Engineers', academic_year: 1, semester: 1, details: { specialization: 'SE', academic_year: 1, semester: 1 }, credits: 4, lectures_per_week: 3 },
  { code: 'SE103', name: 'Software Design Basics', academic_year: 1, semester: 1, details: { specialization: 'SE', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'SE121', name: 'Software Requirements', academic_year: 1, semester: 2, details: { specialization: 'SE', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'SE122', name: 'Object-Oriented Concepts', academic_year: 1, semester: 2, details: { specialization: 'SE', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'SE123', name: 'Testing & QA Basics', academic_year: 1, semester: 2, details: { specialization: 'SE', academic_year: 1, semester: 2 }, credits: 2, lectures_per_week: 1 },
  { code: 'DS101', name: 'Introduction to Data Science', academic_year: 1, semester: 1, details: { specialization: 'DS', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'DS102', name: 'Mathematics for Data Science', academic_year: 1, semester: 1, details: { specialization: 'DS', academic_year: 1, semester: 1 }, credits: 4, lectures_per_week: 3 },
  { code: 'DS103', name: 'Programming for Data Science', academic_year: 1, semester: 1, details: { specialization: 'DS', academic_year: 1, semester: 1 }, credits: 3, lectures_per_week: 2 },
  { code: 'DS121', name: 'Probability & Statistics', academic_year: 1, semester: 2, details: { specialization: 'DS', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'DS122', name: 'Data Wrangling Basics', academic_year: 1, semester: 2, details: { specialization: 'DS', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 },
  { code: 'DS123', name: 'Intro to Machine Learning', academic_year: 1, semester: 2, details: { specialization: 'DS', academic_year: 1, semester: 2 }, credits: 3, lectures_per_week: 2 }
];

const ensureAcademicCoordinatorUser = async () => {
  const existing = await pool.query(
    `SELECT id, name, email, role FROM users WHERE lower(regexp_replace(role, '[^a-z0-9]', '', 'g')) = 'academiccoordinator' LIMIT 1`
  );
  if (existing.rows.length) return existing.rows[0];

  const hashed = await bcrypt.hash(DUMMY_AC_PASSWORD, 10);
  const id = `user_ac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { rows } = await pool.query(
    `INSERT INTO users(id, name, email, password, role, created_at)
     VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id, name, email, role`,
    [id, DUMMY_AC_NAME, DUMMY_AC_EMAIL, hashed, 'Academic Coordinator']
  );
  return rows[0];
};

const insertModuleIfMissingForAC = async (acUser, mod) => {
  try {
    const exists = await pool.query('SELECT id FROM modules WHERE code = $1 LIMIT 1', [mod.code]);
    if (exists.rows.length) {
      console.log(`Skipping existing module: ${mod.code}`);
      return { skipped: true };
    }

    const id = `${mod.code}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const insertSql = `
      INSERT INTO modules(id, code, name, batch_size, day_type, credits, lectures_per_week, details, lic_id, academic_year, semester, created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, code, name
    `;

    const details = mod.details && typeof mod.details === 'object' ? JSON.stringify(mod.details) : null;
    const values = [
      id,
      mod.code,
      mod.name,
      mod.batch_size || null,
      mod.day_type || null,
      mod.credits || null,
      mod.lectures_per_week || null,
      details,
      null,
      mod.academic_year || null,
      mod.semester || null,
      acUser.id,
    ];

    const res = await pool.query(insertSql, values);
    console.log(`Inserted module: ${res.rows[0].code} (${res.rows[0].id}) by AC ${acUser.email}`);
    return { inserted: true };
  } catch (err) {
    console.error('Error inserting module', mod.code, err.message || err);
    return { error: err };
  }
};

const seed = async () => {
  try {
    console.log('Ensuring Academic Coordinator user exists...');
    const acUser = await ensureAcademicCoordinatorUser();
    console.log('Academic Coordinator:', acUser.email || acUser.name || acUser.id);

    let inserted = 0;
    let skipped = 0;
    for (const mod of modulesToSeed) {
      // eslint-disable-next-line no-await-in-loop
      const result = await insertModuleIfMissingForAC(acUser, mod);
      if (result.inserted) inserted += 1;
      if (result.skipped) skipped += 1;
    }

    // Optionally print a JWT for the AC user to use with cookie auth
    try {
      if (process.env.JWT_SECRET) {
        const token = jwt.sign({ id: acUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log('\nAcademic Coordinator auth cookie (set this as `token` cookie for HTTP requests):');
        console.log(token);
      } else {
        console.log('JWT_SECRET not set — skipping token generation output.');
      }
    } catch (e) {
      // ignore
    }

    console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
  } finally {
    try { await pool.end(); } catch (e) { /* ignore */ }
    process.exit(0);
  }
};

seed();
