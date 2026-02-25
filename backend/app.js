import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import { errorMiddleware } from './utils/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();
const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// Body parser and cookie parser
app.use(express.json());
app.use(cookieparser());

// Apply general rate limiter to all routes
app.use(apiLimiter);

// Test database connection on startup
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        console.error('Please check your database configuration in .env file');
    } else {
        console.log('✅ Database connected successfully:', result.rows[0].now);
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Timetable Generator API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorMiddleware);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});




