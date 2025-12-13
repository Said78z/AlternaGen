import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
    getApplications,
    createApplication,
    updateApplication,
    deleteApplication,
} from '../controllers/applications.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /applications
 * @desc    Get all applications (optionally filter by status)
 * @access  Private
 */
router.get('/', getApplications);

/**
 * @route   POST /applications
 * @desc    Create application
 * @access  Private
 */
router.post('/', createApplication);

/**
 * @route   PATCH /applications/:id
 * @desc    Update application status/notes
 * @access  Private
 */
router.patch('/:id', updateApplication);

/**
 * @route   DELETE /applications/:id
 * @desc    Delete application
 * @access  Private
 */
router.delete('/:id', deleteApplication);

export default router;
