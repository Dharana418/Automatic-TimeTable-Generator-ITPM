import express from 'express';
import { registerUser, login, getCurrentUser, logout } from '../controllers/authcontroller.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateRegister, validateLogin } from '../middlewares/validation.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, login);
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", logout);

export default router;

