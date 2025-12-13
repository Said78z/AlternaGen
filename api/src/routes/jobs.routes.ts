import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getJobs, getJobById, createJob, deleteJob } from '../controllers/jobs.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /jobs
 * @desc    Get all jobs for current user (with pagination & filters)
 * @access  Private
 */
router.get('/', getJobs);

/**
 * @route   GET /jobs/:id
 * @desc    Get single job by ID
 * @access  Private
 */
router.get('/:id', getJobById);

/**
 * @route   POST /jobs
 * @desc    Save a new job
 * @access  Private
 */
router.post('/', createJob);

/**
 * @route   DELETE /jobs/:id
 * @desc    Delete a job
 * @access  Private
 */
router.delete('/:id', deleteJob);

export default router;
