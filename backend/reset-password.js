import pg from 'pg';
import "dotenv/config.js";
import bcryptjs from 'bcryptjs';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const hashedPassword = await bcryptjs.hash('Password@123', 10);
        
        // Reset admin
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'admin@timetable.com']);
        console.log('Reset admin@timetable.com password to Password@123');
        
        // Reset academic coordinator
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'academic.coordinator@demo.com']);
        console.log('Reset academic.coordinator@demo.com password to Password@123');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
