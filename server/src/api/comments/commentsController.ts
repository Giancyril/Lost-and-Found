import { Request, Response } from 'express';
import { commentService } from './commentsService';

export const commentsController = {
  async getComments(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const comments = await commentService.getComments(itemId, { page, limit });
    res.json(comments);
  } catch (error: any) {
    console.error('COMMENTS ERROR:', error?.message);
    res.status(500).json({ error: 'Failed to fetch comments', detail: error?.message });
  }
},

  async createComment(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      // user may be undefined for anonymous / unauthenticated requests
      const userId = (req as any).user?.id || null;
      const userRole = (req as any).user?.role || 'USER';

      const comment = await commentService.createComment({
        ...req.body,
        itemId,
        userId,
        userRole
      });

      // Broadcast real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`item-${itemId}`).emit('comment-added', comment);
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  },

  async updateComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const updated = await commentService.updateComment(
        commentId, 
        req.body.updateData, 
        userId, 
        userRole
      );

      res.json(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  },

  async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      await commentService.deleteComment(commentId, userId, userRole);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  },

  async voteHelpful(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user?.id;

      const updated = await commentService.voteHelpful(commentId, userId);
      res.json(updated);
    } catch (error) {
      console.error('Error voting helpful:', error);
      res.status(500).json({ error: 'Failed to vote helpful' });
    }
  }
};