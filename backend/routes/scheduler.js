import express from 'express';
import {
	addItem,
	createModuleAssignment,
	deleteItem,
	deleteModuleAssignment,
	getLicsWithInstructors,
	listItems,
	listModuleAssignments,
	resetData,
	runScheduler,
	updateItem,
	updateModuleAssignment,
} from '../controllers/schedulerController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// protect all scheduler routes and allow only faculty coordinator role
router.use(protect);
router.use(authorize('facultycoordinator', 'academiccoordinator'));
// Specific helpers
router.get('/lics-with-instructors', getLicsWithInstructors);
router.get('/assignments', listModuleAssignments);
router.post('/assignments', createModuleAssignment);
router.put('/assignments/:id', updateModuleAssignment);
router.delete('/assignments/:id', deleteModuleAssignment);

router.post('/run', runScheduler);
router.post('/reset', resetData);

router.post('/:type', addItem);
router.get('/:type', listItems);
router.put('/:type/:id', updateItem);
router.delete('/:type/:id', deleteItem);

export default router;

