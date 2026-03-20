
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import schedulerRoutes from './routes/scheduler.js';
import initDb from './config/initDb.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(cookieparser());
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully:', result.rows[0]);
    }
});

// Ensure scheduler tables exist
initDb().catch(err => {
    console.error('Failed to initialize DB tables for scheduler:', err);
});


app.use('/api/auth', authRoutes);
app.use('/api/scheduler', schedulerRoutes);

app.get('/', (req, res) => {
    res.send('Timetable Generator API is running!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




