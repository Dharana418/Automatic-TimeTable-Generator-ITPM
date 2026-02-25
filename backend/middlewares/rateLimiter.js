export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const identifier = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        for (const [key, value] of requests.entries()) {
            if (now - value.resetTime > windowMs) {
                requests.delete(key);
            }
        }
        let tracker = requests.get(identifier);
        if (!tracker || now - tracker.resetTime > windowMs) {
            tracker = {
                count: 0,
                resetTime: now
            };
            requests.set(identifier, tracker);
        }

        // Increment count
        tracker.count++;

        // Check if limit exceeded
        if (tracker.count > max) {
            return res.status(429).json({
                error: 'Too many requests, please try again later'
            });
        }

        next();
    };
};

// Strict rate limiter for auth endpoints
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// General API rate limiter
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
