import express from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/faculty-coordinator', verifyToken, checkRole('Faculty Coordinator'), (req, res) => {
    res.send('Faculty Coordinator route');
});
router.get('/lic', verifyToken, checkRole('LIC'), (req, res) => {
    res.send('LIC route');
});

router.get('/academic-coordinator', verifyToken, checkRole('Academic Coordinator'), (req, res) => {
    res.send('Academic Coordinator route');
});

router.get('/instructor', verifyToken, checkRole('Instructor'), (req, res) => {
    res.send('Instructor route');
});

router.get('/lecturer-senior-lecturer', verifyToken, checkRole('Lecturer/Senior Lecturer'), (req, res) => {
    res.send('Lecturer/Senior Lecturer route');
});

export default router;






    


