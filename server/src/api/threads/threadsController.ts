import { Request, Response } from 'express';
import { threadsService } from './threadsService';

export const threadsController = {
  async getAllThreads(req: Request, res: Response) {
    try {
      res.json(await threadsService.getAllThreads());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  },

  async createThread(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      res.status(201).json(await threadsService.createThread({ ...req.body, userId }));
    } catch (error) {
      res.status(500).json({ error: 'Failed to create thread' });
    }
  },

  async getThreadById(req: Request, res: Response) {
    try {
      const thread = await threadsService.getThreadById(req.params.threadId);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      res.json(thread);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  },

  async updateThread(req: Request, res: Response) {
    try {
      res.json(await threadsService.updateThread(req.params.threadId, req.body));
    } catch (error) {
      res.status(500).json({ error: 'Failed to update thread' });
    }
  },

  async deleteThread(req: Request, res: Response) {
    try {
      await threadsService.deleteThread(req.params.threadId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  },

  async getThreadReplies(req: Request, res: Response) {
    try {
      res.json(await threadsService.getThreadReplies(req.params.threadId));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch replies' });
    }
  },

  async createReply(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      res.status(201).json(await threadsService.createReply({ 
        ...req.body, 
        threadId: req.params.threadId,
        userId 
      }));
    } catch (error) {
      res.status(500).json({ error: 'Failed to create reply' });
    }
  }
};