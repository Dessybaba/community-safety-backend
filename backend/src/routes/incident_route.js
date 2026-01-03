import express from 'express';
import {
  createIncident,
  getVerifiedIncidents,
  getMyIncidents,
  getIncidentById,
  updateMyIncident,
  deleteMyIncident,
  getAllIncidents,
  verifyIncident,
  rejectIncident,
  resolveIncident,
} from '../controllers/incident_controller.js';
import { authenticate } from '../middleware/auth_middleware.js';
import { requireModerator } from '../middleware/role_middleware.js';
import { uploadImages } from '../middleware/upload_middleware.js';

const router = express.Router();

// Public route - Get verified incidents
router.get('/verified', getVerifiedIncidents);

// Protected routes - User operations
router.post('/', authenticate, uploadImages, createIncident);
router.get('/my-incidents', authenticate, getMyIncidents);

// Moderator/Admin routes - Must come before /:id routes
router.get('/', authenticate, requireModerator, getAllIncidents);
router.patch('/:id/verify', authenticate, requireModerator, verifyIncident);
router.patch('/:id/reject', authenticate, requireModerator, rejectIncident);
router.patch('/:id/resolve', authenticate, requireModerator, resolveIncident);

// User routes for specific incidents
router.get('/:id', authenticate, getIncidentById);
router.put('/:id', authenticate, updateMyIncident);
router.delete('/:id', authenticate, deleteMyIncident);

export default router;

