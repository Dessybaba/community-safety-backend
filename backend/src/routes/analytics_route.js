import express from 'express';
import {
  getOverallStats,
  getIncidentsByType,
  getIncidentsByStatus,
  getIncidentsOverTime,
  getTopReporters,
  getRecentActivity,
  getVerificationStats,
} from '../controllers/analytics_controller.js';
import { authenticate } from '../middleware/auth_middleware.js';
import { requireModerator } from '../middleware/role_middleware.js';

const router = express.Router();

// All analytics routes require authentication and moderator/admin role
router.use(authenticate);
router.use(requireModerator);

router.get('/overall', getOverallStats);
router.get('/by-type', getIncidentsByType);
router.get('/by-status', getIncidentsByStatus);
router.get('/over-time', getIncidentsOverTime);
router.get('/top-reporters', getTopReporters);
router.get('/recent-activity', getRecentActivity);
router.get('/verification-stats', getVerificationStats);

export default router;

