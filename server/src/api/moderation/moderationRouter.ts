import { Router } from 'express';
import { moderationService } from './moderationService';

const router = Router();

// Get all pending moderation items
router.get('/pending', moderationService.getPendingItems);

// Approve a comment
router.post('/comments/:commentId/approve', moderationService.approveComment);

// Reject a comment
router.post('/comments/:commentId/reject', moderationService.rejectComment);

// Get moderation statistics
router.get('/stats', moderationService.getModerationStats);

// Get moderation logs
router.get('/logs', moderationService.getModerationLogs);

export { router as moderationRouter };
