import express from 'express';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.use(protect);
router.use(authorize('academiccoordinator', 'facultycoordinator'));

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Academic coordinator route is active',
  });
});

export default router;
