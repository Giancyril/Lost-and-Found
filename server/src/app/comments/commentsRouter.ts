import { Router } from 'express';
import { commentsController } from './commentsController';
import auth from '../midddlewares/auth';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting: 10 comments per minute per user
const commentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many comments, please try again later'
});

// Get comments for a specific item (public)
router.get('/items/:itemId/comments', commentsController.getComments);

// Create a new comment — auth optional (anon comments allowed)
router.post('/items/:itemId/comments',
  commentRateLimit,
  commentsController.createComment
);

// Update a comment (authenticated users only)
router.put('/comments/:commentId',
  auth(),
  commentsController.updateComment
);

// Delete a comment (authenticated users only)
router.delete('/comments/:commentId',
  auth(),
  commentsController.deleteComment
);

// Vote on a comment (authenticated users only)
router.post('/comments/:commentId/vote-helpful',
  auth(),
  commentsController.voteHelpful
);

export { router as commentsRouter };
