import pg from 'pg';
import "dotenv/config.js";
import fs from 'fs';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query('SELECT name, email, role FROM users');
        fs.writeFileSync('users.json', JSON.stringify(res.rows, null, 2));
        console.log('Done writing users.json');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
