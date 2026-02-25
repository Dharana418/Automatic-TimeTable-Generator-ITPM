import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';

const verifyToken = async (req, res, next) => {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Use findById instead of Sequelize's findByPk
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    } else {
        return res.status(403).json({ message: 'No token provided' });
    }
};

const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

export { verifyToken, checkRole };


