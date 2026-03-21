import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let pool;

// Log database configuration (without password for security)
console.log('Database configuration:');
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
console.log('- DB_NAME:', process.env.DB_NAME || 'not set');

try {
    // If a full DATABASE_URL is provided, use it
    if (process.env.DATABASE_URL) {
        console.log('Using DATABASE_URL connection');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false  // Required for Supabase
            },
            // Add connection timeout
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
        });
    } 
    // Otherwise use individual env vars
    else if (process.env.DB_HOST) {
        console.log('Using individual DB credentials');
        pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: false,  // Local PostgreSQL usually doesn't need SSL
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
        });
    } 
    else {
        console.error('No database configuration found!');
        throw new Error('Database configuration missing');
    }

    // Test the connection immediately
    pool.on('connect', () => {
        console.log('✅ Connected to the database successfully');
    });

    pool.on('error', (err) => {
        console.error('❌ Database error:', err.message);
    });

    // Test connection
    const testConnection = async () => {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            console.log('✅ Database test query successful:', result.rows[0].now);
            client.release();
            return true;
        } catch (err) {
            console.error('❌ Database test query failed:', err.message);
            return false;
        }
    };

    // Run test connection immediately
    testConnection();

} catch (err) {
    console.error('❌ Failed to create database pool:', err.message);
    // Create a dummy pool that won't work but prevents crashes
    pool = new Pool(); // This will likely fail but at least won't throw
}

export default pool;