import pool from '../config/db.js';
import validator from 'validator';

class User {
    static async findByEmail(email) {
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT id, username, email, address, birthday, phonenumber, role, created_at FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async create(userData) {
        const { username, email, password, address, birthday, phonenumber, role } = userData;
        
        // Validate email
        if (!validator.isEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Validate password length
        if (password && password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        try {
            const result = await pool.query(
                `INSERT INTO users (username, email, password, address, birthday, phonenumber, role) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING id, username, email, address, birthday, phonenumber, role, created_at`,
                [username, email, password, address || null, birthday || null, phonenumber || null, role || 'user']
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique violation error code
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }

    static async updateResetToken(email, token, expire) {
        try {
            const result = await pool.query(
                'UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE email = $3 RETURNING *',
                [token, expire, email]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
}

export default User;


