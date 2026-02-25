import User from '../models/usermodel.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerUser = async (req, res) => {
    try {
        const { email, username, password, address, birthday, phonenumber, role } = req.body;
        
        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({ error: "Email, username, and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);
        
        // Create new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            address,
            birthday,
            phonenumber,
            role
        });

        res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT token with 'id' field (not 'userId')
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        
        // Set cookie
        res.cookie("token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production" 
        });

        res.json({ 
            message: "Login successful", 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        
        res.json({ 
            user: { 
                id: req.user.id, 
                username: req.user.username, 
                email: req.user.email, 
                role: req.user.role 
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie("token");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

export { registerUser, login, getCurrentUser, logout };





