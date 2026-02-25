import validator from 'validator';

// Validation middleware for registration
export const validateRegister = (req, res, next) => {
    const { username, email, password, phonenumber } = req.body;
    const errors = [];

    // Validate username
    if (!username || username.trim().length < 2) {
        errors.push('Username must be at least 2 characters long');
    }
    if (username && username.length > 50) {
        errors.push('Username cannot exceed 50 characters');
    }

    // Validate email
    if (!email) {
        errors.push('Email is required');
    } else if (!validator.isEmail(email)) {
        errors.push('Please provide a valid email address');
    }

    // Validate password
    if (!password) {
        errors.push('Password is required');
    } else {
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/(?=.*[@$!%*?&#])/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&#)');
        }
    }

    // Validate phone number if provided
    if (phonenumber && phonenumber.trim() && !validator.isMobilePhone(phonenumber, 'any', { strictMode: false })) {
        errors.push('Please provide a valid phone number');
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    // Trim string inputs
    if (req.body.username) req.body.username = req.body.username.trim();
    if (req.body.email) req.body.email = req.body.email.trim();
    if (req.body.address) req.body.address = req.body.address.trim();
    if (req.body.phonenumber) req.body.phonenumber = req.body.phonenumber.trim();

    next();
};

// Validation middleware for login
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    } else if (!validator.isEmail(email)) {
        errors.push('Please provide a valid email address');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    // Trim inputs
    if (req.body.email) req.body.email = req.body.email.trim();

    next();
};
