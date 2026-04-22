import pool from '../config/db.js';

const modulesToSeed = [
  // IT Year 1 Semester 1
  {
    id: 'mod_IT_Y1_S1_001', code: 'IT101', name: 'Introduction to Information Technology', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_IT_Y1_S1_002', code: 'IT102', name: 'Computing Fundamentals', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_IT_Y1_S1_003', code: 'IT103', name: 'Intro to Programming', academic_year: 1, semester: 1,
    credits: 4, lectures_per_week: 3, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 1 }
  },

  // IT Year 1 Semester 2
  {
    id: 'mod_IT_Y1_S2_001', code: 'IT121', name: 'Data Structures (Intro)', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_IT_Y1_S2_002', code: 'IT122', name: 'Digital Systems', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_IT_Y1_S2_003', code: 'IT123', name: 'Web Foundations', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'IT', academic_year: 1, semester: 2 }
  },

  // SE Year 1 Semester 1
  {
    id: 'mod_SE_Y1_S1_001', code: 'SE101', name: 'Software Engineering Fundamentals', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_SE_Y1_S1_002', code: 'SE102', name: 'Programming for Software Engineers', academic_year: 1, semester: 1,
    credits: 4, lectures_per_week: 3, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_SE_Y1_S1_003', code: 'SE103', name: 'Software Design Basics', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 1 }
  },

  // SE Year 1 Semester 2
  {
    id: 'mod_SE_Y1_S2_001', code: 'SE121', name: 'Software Requirements', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_SE_Y1_S2_002', code: 'SE122', name: 'Object-Oriented Concepts', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_SE_Y1_S2_003', code: 'SE123', name: 'Testing & QA Basics', academic_year: 1, semester: 2,
    credits: 2, lectures_per_week: 1, day_type: 'weekday', details: { specialization: 'SE', academic_year: 1, semester: 2 }
  },

  // DS Year 1 Semester 1
  {
    id: 'mod_DS_Y1_S1_001', code: 'DS101', name: 'Introduction to Data Science', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_DS_Y1_S1_002', code: 'DS102', name: 'Mathematics for Data Science', academic_year: 1, semester: 1,
    credits: 4, lectures_per_week: 3, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 1 }
  },
  {
    id: 'mod_DS_Y1_S1_003', code: 'DS103', name: 'Programming for Data Science', academic_year: 1, semester: 1,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 1 }
  },

  // DS Year 1 Semester 2
  {
    id: 'mod_DS_Y1_S2_001', code: 'DS121', name: 'Probability & Statistics', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_DS_Y1_S2_002', code: 'DS122', name: 'Data Wrangling Basics', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 2 }
  },
  {
    id: 'mod_DS_Y1_S2_003', code: 'DS123', name: 'Intro to Machine Learning', academic_year: 1, semester: 2,
    credits: 3, lectures_per_week: 2, day_type: 'weekday', details: { specialization: 'DS', academic_year: 1, semester: 2 }
  }
];

const insertModuleIfMissing = async (mod) => {
  try {
    const exists = await pool.query('SELECT id FROM modules WHERE code = $1 LIMIT 1', [mod.code]);
    if (exists.rows.length) {
      console.log(`Skipping existing module: ${mod.code}`);
      return { skipped: true };
    }

    const insertSql = `
      INSERT INTO modules(id, code, name, batch_size, day_type, credits, lectures_per_week, details, academic_year, semester, created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, code, name
    `;

    const details = mod.details && typeof mod.details === 'object' ? JSON.stringify(mod.details) : null;

    const values = [
      mod.id,
      mod.code,
      mod.name,
      mod.batch_size || null,
      mod.day_type || null,
      mod.credits || null,
      mod.lectures_per_week || null,
      details,
      mod.academic_year || null,
      mod.semester || null,
      null,
    ];

    const res = await pool.query(insertSql, values);
    console.log(`Inserted module: ${res.rows[0].code} (${res.rows[0].id})`);
    return { inserted: true };
  } catch (err) {
    console.error('Error inserting module', mod.code, err.message || err);
    return { error: err };
  }
};

const seed = async () => {
  console.log('Seeding dummy modules...');
  let inserted = 0;
  let skipped = 0;
  for (const mod of modulesToSeed) {
    // eslint-disable-next-line no-await-in-loop
    const result = await insertModuleIfMissing(mod);
    if (result.inserted) inserted += 1;
    if (result.skipped) skipped += 1;
  }

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
  // Close pool and exit
  try {
    await pool.end();
  } catch (e) {
    // ignore
  }
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
