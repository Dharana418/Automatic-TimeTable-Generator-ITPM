import fs from 'node:fs';
import path from 'node:path';
import pool from '../config/db.js';

const RAW_FILE = path.resolve(process.cwd(), 'data', 'module_catalog_raw.txt');

const SPECIALIZATION_MAP = {
  SE: 'SE',
  IT: 'IT',
  IE: 'IME',
};

const normalizeModuleName = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim();

const deriveAcademicYear = (code = '') => {
  const digit = code.slice(2, 3);
  if (['1', '2', '3', '4'].includes(digit)) return digit;
  return null;
};

const deriveSemester = (code = '') => {
  const digit = code.slice(3, 4);
  if (digit === '0') return '1';
  if (digit === '1') return '2';
  if (/\d/.test(digit)) return '2';
  return null;
};

const deriveSpecialization = (code = '') => {
  const prefix = String(code).slice(0, 2).toUpperCase();
  return SPECIALIZATION_MAP[prefix] || prefix || 'GENERAL';
};

const parseCatalogLines = (rawText = '') => {
  const lines = String(rawText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const seen = new Set();
  const parsed = [];

  for (const line of lines) {
    if (line.toLowerCase() === '--select module--') continue;
    if (line.toLowerCase() === 'other') continue;

    const match = line.match(/^([A-Za-z]{2}\d{4})\s*-\s*(.+)$/);
    if (!match) continue;

    const code = match[1].toUpperCase();
    const name = normalizeModuleName(match[2]);
    if (!name) continue;

    if (seen.has(code)) continue;
    seen.add(code);

    parsed.push({
      code,
      name,
      academicYear: deriveAcademicYear(code),
      semester: deriveSemester(code),
      specialization: deriveSpecialization(code),
    });
  }

  return parsed;
};

const makeModuleId = (module) =>
  `module_${module.code.toLowerCase()}_${module.academicYear || 'x'}_${module.semester || 'x'}`;

const run = async () => {
  const raw = fs.readFileSync(RAW_FILE, 'utf8');
  const modules = parseCatalogLines(raw);

  if (!modules.length) {
    throw new Error('No valid modules were parsed from catalog file.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM modules');

    for (const module of modules) {
      const details = {
        specialization: module.specialization,
        academic_year: module.academicYear,
        semester: module.semester,
        source: 'catalog-replacement',
      };

      await client.query(
        `INSERT INTO modules (
          id,
          code,
          name,
          academic_year,
          semester,
          details,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NULL)`,
        [
          makeModuleId(module),
          module.code,
          module.name,
          module.academicYear,
          module.semester,
          JSON.stringify(details),
        ],
      );
    }

    await client.query('COMMIT');
    console.log(`Replaced modules table with ${modules.length} catalog modules.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Catalog replacement failed:', error.message);
  process.exit(1);
});
