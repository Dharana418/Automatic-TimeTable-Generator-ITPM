import express from 'express';
import { addItem, listItems, resetData, runScheduler } from '../controllers/schedulerController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// protect all scheduler routes and allow only faculty coordinator role
router.use(protect);
router.use(authorize('facultycoordinator'));

router.post('/:type', addItem);
router.get('/:type', listItems);
router.post('/run', runScheduler);
router.post('/reset', resetData);

export default router;

