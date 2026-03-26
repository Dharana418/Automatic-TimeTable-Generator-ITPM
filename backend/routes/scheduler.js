import express from 'express';
import {
    addItem,
    createModuleAssignment,
    deleteModuleAssignment,
    deleteItem,
    getLicsWithInstructors,
    listItems,
    listModuleAssignments,
    resetData,
    runScheduler,
    updateItem,
} from '../controllers/schedulerController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Protect all scheduler routes and allow faculty coordinator and academic coordinator
router.use(protect);
router.use(authorize('facultycoordinator', 'academiccoordinator', 'Faculty Coordinator', 'Academic Coordinator'));

// Specific helpers
router.get('/lics-with-instructors', getLicsWithInstructors);
router.get('/assignments', listModuleAssignments);
router.post('/assignments', createModuleAssignment);
router.delete('/assignments/:id', deleteModuleAssignment);

router.post('/run', runScheduler);
router.post('/reset', resetData);

// CRUD operations
router.post('/:type', addItem);
router.get('/:type', listItems);
router.put('/:type/:id', updateItem);
router.delete('/:type/:id', deleteItem);

export default router;