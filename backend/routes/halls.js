import express from 'express';
import {
  addHallResource,
  getHallResources,
  updateHallResource,
  deleteHallResource,
  addHallRating,
  getHallRatings,
  getHallStats,
  getActivityLogs,
  getHallActivityLogs,
  getHallRecommendations,
  getCachedRecommendations
} from '../controllers/hallController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// ============= RESOURCE MANAGEMENT =============
router.post('/resources', 
  authorize('admin', 'academiccoordinator', 'facultycoordinator', 'Admin', 'Academic Coordinator', 'Faculty Coordinator'),
  addHallResource
);

router.get('/:hallId/resources', getHallResources);

router.put('/resources/:resourceId', 
  authorize('admin', 'academiccoordinator', 'facultycoordinator', 'Admin', 'Academic Coordinator', 'Faculty Coordinator'),
  updateHallResource
);

router.delete('/resources/:resourceId',
  authorize('admin', 'academiccoordinator', 'facultycoordinator', 'Admin', 'Academic Coordinator', 'Faculty Coordinator'),
  deleteHallResource
);

// ============= RATING & FEEDBACK =============
router.post('/ratings', addHallRating);

router.get('/:hallId/ratings', getHallRatings);

router.get('/:hallId/stats', getHallStats);

// ============= ACTIVITY LOGS =============
router.get('/logs/activity', getActivityLogs);

router.get('/:hallId/logs', getHallActivityLogs);

// ============= SMART RECOMMENDATIONS =============
router.get('/recommendations/suggest', getHallRecommendations);

router.get('/recommendations/cached/:moduleId', getCachedRecommendations);

export default router;
