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
// Set CORS_ORIGINS to a comma-separated list of allowed origins for staging/production,
// e.g. CORS_ORIGINS=https://app.example.com,https://staging.example.com
const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server tools (no Origin header).
        if (!origin) return callback(null, true);
        // Always allow localhost / 127.0.0.1 for local development.
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (isLocalhost) return callback(null, true);
        // Allow any explicitly configured origin.
        if (configuredOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
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
let server = null;
let isShuttingDown = false;
let currentPort = Number(process.env.PORT || 5000);

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

// Routes
const registerRoutes = () => {
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
};

const bindServer = () => {
    const targetPort = currentPort;

    server = app.listen(targetPort);

    server.on('listening', () => {
        console.log(`🚀 Server is running on port ${targetPort}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${targetPort}/api/health`);
    });

    server.on('error', (err) => {
        if (err?.code === 'EADDRINUSE' && !isShuttingDown) {
            const nextPort = targetPort + 1;
            console.warn(`⚠️ Port ${targetPort} is already in use. Retrying on ${nextPort}...`);
            currentPort = nextPort;
            setTimeout(() => bindServer(), 300);
            return;
        }

        console.error('❌ HTTP server error:', err);
    });

    server.on('close', () => {
        console.warn('⚠️ HTTP server closed.');
        if (!isShuttingDown) {
            console.warn('↩️ Attempting to restart server in 1 second...');
            setTimeout(() => {
                try {
                    bindServer();
                } catch (err) {
                    console.error('❌ Failed to restart HTTP server:', err);
                }
            }, 1000);
        }
    });
};

// Start server
const startServer = async () => {
    // Test database connection
    await testDatabaseConnection();

    // Initialize tables if connected
    if (dbConnected) {
        await initializeDatabase();
    }

    registerRoutes();
    bindServer();
};

const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`🛑 Received ${signal}. Shutting down gracefully...`);

    const closeServerPromise = new Promise((resolve) => {
        if (!server) return resolve();
        server.close(() => {
            console.log('✅ HTTP server closed.');
            resolve();
        });
    });

    const closePoolPromise = pool.end()
        .then(() => console.log('✅ Database pool closed.'))
        .catch((err) => console.error('❌ Error closing database pool:', err.message));

    await Promise.all([closeServerPromise, closePoolPromise]);
    process.exit(0);
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('beforeExit', (code) => {
    console.warn(`⚠️ Process beforeExit event with code ${code}.`);
});

process.on('exit', (code) => {
    console.warn(`ℹ️ Process exit event with code ${code}.`);
});

// Start server
startServer();

export default app;