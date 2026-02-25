class ErrorHandler extends Error {
    constructor(message, errorCode) {
        super(message);
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Global error handler middleware
export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        statusCode: err.statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Send error response
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default ErrorHandler;