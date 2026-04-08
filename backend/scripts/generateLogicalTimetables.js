import { runSchedulerForYearSemester } from '../controllers/schedulerController.js';
import pool from '../config/db.js';

const parseArgs = (argv = []) => {
  const args = {};
  for (const rawArg of argv) {
    const [rawKey, rawValue] = String(rawArg || '').split('=');
    const key = String(rawKey || '').trim();
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = rawValue == null ? 'true' : String(rawValue).trim();
  }
  return args;
};

const asPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  const algorithm = String(args.algorithm || 'pso').toLowerCase();
  const iterations = asPositiveInt(args.iterations, 30);
  const particles = asPositiveInt(args.particles, 20);
  const yearFilter = args.year ? String(asPositiveInt(args.year, 0)) : null;
  const semesterFilter = args.semester ? String(asPositiveInt(args.semester, 0)) : null;

  const pairQuery = `
    SELECT academic_year, semester, COUNT(*)::int AS modules
    FROM modules
    WHERE ($1::text IS NULL OR academic_year = $1::text)
      AND ($2::text IS NULL OR semester = $2::text)
    GROUP BY academic_year, semester
    ORDER BY academic_year, semester
  `;

  const pairResult = await pool.query(pairQuery, [yearFilter, semesterFilter]);
  if (!pairResult.rows.length) {
    throw new Error('No module records found for the requested year/semester filters.');
  }

  const results = [];
  for (const pair of pairResult.rows) {
    const academicYear = Number(pair.academic_year);
    const semester = Number(pair.semester);

    const request = {
      body: {
        academicYear,
        semester,
        algorithms: [algorithm],
        options: {
          iterations,
          particles,
        },
        timetableName: `Logical_${algorithm.toUpperCase()}_Y${academicYear}_S${semester}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`,
      },
      user: {
        id: null,
        role: 'facultycoordinator',
      },
    };

    const response = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.payload = data;
        return this;
      },
    };

    await runSchedulerForYearSemester(request, response);

    const algorithmResult = response.payload?.results?.[algorithm] || response.payload?.results?.hybrid || null;
    const stats = algorithmResult?.stats || {};
    const conflicts = Array.isArray(algorithmResult?.conflicts) ? algorithmResult.conflicts.length : 0;

    results.push({
      academicYear,
      semester,
      statusCode: response.statusCode,
      success: Boolean(response.payload?.success),
      timetableId: response.payload?.timetableId || null,
      message: response.payload?.message || response.payload?.error || null,
      modules: Number(pair.modules || 0),
      coverage: stats.coverage ?? null,
      conflicts,
    });
  }

  console.log(JSON.stringify(results, null, 2));
};

run()
  .catch((error) => {
    console.error('generateLogicalTimetables failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // ignore close errors on shutdown
    }
  });
