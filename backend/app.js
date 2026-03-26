import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import schedulerRoutes from './routes/scheduler.js';
import academicCoordinatorRoutes from './routes/academicCoordinator.js';
import hallRoutes from './routes/halls.js';
import initDb from './config/initDb.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
        ];

        const isLocalhostPort = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

        if (allowedOrigins.includes(origin) || isLocalhostPort) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection flag
let dbConnected = false;

// Test database connection
const testDatabaseConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully:', result.rows[0].now);
        dbConnected = true;
        return true;
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        dbConnected = false;
        return false;
    }
};

// Initialize database tables
const initializeDatabase = async () => {
    try {
        if (dbConnected) {
            await initDb();
        } else {
            console.log('⚠️ Skipping table initialization - no database connection');
        }
    } catch (err) {
        console.error('❌ Failed to initialize database tables:', err.message);
    }
};

// Start server
const startServer = async () => {
    // Test database connection
    await testDatabaseConnection();
    
    // Initialize tables if connected
    if (dbConnected) {
        await initializeDatabase();
    }
    
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/scheduler', schedulerRoutes);
    app.use('/api/academic-coordinator', academicCoordinatorRoutes);
    app.use('/api/halls', hallRoutes);
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            message: 'Timetable Generator API is running!',
            version: '1.0.0',
            database: dbConnected ? 'connected' : 'disconnected',
            endpoints: {
                auth: '/api/auth',
                scheduler: '/api/scheduler',
                academicCoordinator: '/api/academic-coordinator',
                health: '/api/health'
            }
        });
    });
    
    // 404 handler
    app.use((req, res) => {
        const methodHint =
            req.originalUrl === '/api/auth/bootstrap-admin'
                ? 'Use POST /api/auth/bootstrap-admin'
                : req.originalUrl === '/api/auth/admin/users'
                    ? 'Use POST /api/auth/admin/users'
                    : null;

        res.status(404).json({
            success: false,
            message: `Route ${req.originalUrl} not found`,
            method: req.method,
            ...(methodHint ? { hint: methodHint } : {}),
        });
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err.stack);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });
    
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${port}/api/health`);
    });
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// Start server
startServer();

export default app;