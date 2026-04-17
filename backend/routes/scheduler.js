import express from 'express';
import {
    addItem,
    createModuleAssignment,
    deleteModuleAssignment,
    deleteItem,
    getLicDailyTimetable,
    getLicsWithInstructors,
    getCoordinatorHallAllocations,
    getSoftConstraints,
    listItems,
    listModuleAssignments,
    resetData,
    runScheduler,
    updateItem,
    runSchedulerBySegments,
    runSchedulerForYearSemester,
    upsertSoftConstraints,
    updateModuleAssignment,
} from '../controllers/schedulerController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Protect all scheduler routes and allow authorized academic roles
router.use(protect);
router.use(
    authorize(
        'admin',
        'facultycoordinator',
        'academiccoordinator',
        'lic',
        'instructor',
        'professor',
        'lecturer',
        'assistantlecturer',
        'seniorlecturer',
        'lecturerseniorlecturer',
        'Admin',
        'Faculty Coordinator',
        'Academic Coordinator',
        'LIC',
        'Instructor',
        'Professor',
        'Lecturer',
        'Assistant Lecturer',
        'Senior Lecturer',
        'Lecturer/Senior Lecturer'
    )
);

// Specific helpers
router.get('/lics-with-instructors', getLicsWithInstructors);
router.get(
    '/hall-allocations/coordinator',
    authorize('facultycoordinator', 'academiccoordinator', 'Faculty Coordinator', 'Academic Coordinator'),
    getCoordinatorHallAllocations
);
router.get('/lic/daily-timetable', getLicDailyTimetable);
router.get('/soft-constraints', getSoftConstraints);
router.post('/soft-constraints', upsertSoftConstraints);
router.get('/assignments', listModuleAssignments);
router.post('/assignments', authorize('admin', 'academiccoordinator', 'facultycoordinator', 'lic', 'Admin', 'Academic Coordinator', 'Faculty Coordinator', 'LIC'), createModuleAssignment);
router.put('/assignments/:id', authorize('admin', 'academiccoordinator', 'facultycoordinator', 'lic', 'Admin', 'Academic Coordinator', 'Faculty Coordinator', 'LIC'), updateModuleAssignment);
router.delete('/assignments/:id', authorize('admin', 'academiccoordinator', 'facultycoordinator', 'lic', 'Admin', 'Academic Coordinator', 'Faculty Coordinator', 'LIC'), deleteModuleAssignment);

router.post('/run', authorize('facultycoordinator', 'Faculty Coordinator'), runScheduler);
router.post('/run-by-segments', authorize('facultycoordinator', 'Faculty Coordinator'), runSchedulerBySegments);
router.post('/run-for-year-semester', authorize('facultycoordinator', 'Faculty Coordinator'), runSchedulerForYearSemester);
router.post('/reset', authorize('admin', 'facultycoordinator', 'academiccoordinator', 'Admin', 'Faculty Coordinator', 'Academic Coordinator'), resetData);

// CRUD operations
router.post('/:type', authorize('admin', 'facultycoordinator', 'academiccoordinator', 'Admin', 'Faculty Coordinator', 'Academic Coordinator'), addItem);
router.get('/:type', listItems);
router.put('/:type/:id', authorize('admin', 'facultycoordinator', 'academiccoordinator', 'Admin', 'Faculty Coordinator', 'Academic Coordinator'), updateItem);
router.delete('/:type/:id', authorize('admin', 'facultycoordinator', 'academiccoordinator', 'Admin', 'Faculty Coordinator', 'Academic Coordinator'), deleteItem);

export default router;