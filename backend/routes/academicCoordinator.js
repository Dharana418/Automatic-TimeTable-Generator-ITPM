import express from 'express';
import {
    getAllTimetables,
    approveTimetable,
    rejectTimetable,
    getConflicts,
    resolveConflict,
    getScheduleReports,
    getAcademicCalendar,
    createAcademicEvent,
    updateAcademicEvent,
    deleteAcademicEvent,
    overrideConstraint,
    getDashboardStats
} from '../controllers/academicCoordinatorController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log(`[Academic Coordinator] ${req.method} ${req.originalUrl}`);
    next();
});

// All routes require authentication and academic coordinator role
router.use(protect);
router.use(authorize('academiccoordinator'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// Timetable management
router.get('/timetables', getAllTimetables);
router.put('/timetables/:id/approve', approveTimetable);
router.put('/timetables/:id/reject', rejectTimetable);

// Conflict management
router.get('/conflicts', getConflicts);
router.put('/conflicts/:id/resolve', resolveConflict);

// Reports
router.get('/reports', getScheduleReports);

// Academic calendar
router.route('/calendar')
    .get(getAcademicCalendar)
    .post(createAcademicEvent);

router.route('/calendar/:id')
    .put(updateAcademicEvent)
    .delete(deleteAcademicEvent);

// Constraint override
router.post('/override', overrideConstraint);

export default router;