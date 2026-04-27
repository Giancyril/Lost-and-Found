import { Router } from 'express';
import { threadsController } from './threadsController';
import { authMiddleware } from '../../app/midddlewares/auth';

const router = Router();

// Get all discussion threads
router.get('/', threadsController.getAllThreads);

// Create a new discussion thread
router.post('/', authMiddleware, threadsController.createThread);

// Get thread details
router.get('/:threadId', threadsController.getThreadById);

// Update a thread
router.put('/:threadId', authMiddleware, threadsController.updateThread);

// Delete a thread
router.delete('/:threadId', authMiddleware, threadsController.deleteThread);

// Get replies for a thread
router.get('/:threadId/replies', threadsController.getThreadReplies);

// Create a reply
router.post('/:threadId/replies', authMiddleware, threadsController.createReply);

export { router as threadsRouter };
