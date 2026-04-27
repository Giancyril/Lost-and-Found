import { Request, Response } from 'express';
import { reputationService } from './reputationService';

export const reputationController = {
  // Get user reputation
  async getUserReputation(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const reputation = await reputationService.getUserReputation(userId);
      res.json(reputation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user reputation' });
    }
  },

  // Get user reputation history
  async getReputationHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const history = await reputationService.getReputationHistory(
        userId,
        Number(page),
        Number(limit)
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get reputation history' });
    }
  },

  // Get user badges
  async getUserBadges(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const badges = await reputationService.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user badges' });
    }
  },

  // Get reputation ranking
  async getReputationRanking(req: Request, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const ranking = await reputationService.getReputationRanking(
        Number(limit),
        Number(offset)
      );
      res.json(ranking);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get reputation ranking' });
    }
  },

  // Update user reputation (admin only)
  async updateUserReputation(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { points, reason } = req.body;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const updatedReputation = await reputationService.updateUserReputation(
        userId,
        points,
        reason
      );
      res.json(updatedReputation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user reputation' });
    }
  },

  // Award badge to user (admin only)
  async awardBadge(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { badgeId, badgeData } = req.body;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const badge = await reputationService.awardBadge(userId, badgeId, badgeData);
      res.json(badge);
    } catch (error) {
      res.status(500).json({ error: 'Failed to award badge' });
    }
  },

  // Remove badge from user (admin only)
  async removeBadge(req: Request, res: Response) {
    try {
      const { userId, badgeId } = req.params;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      await reputationService.removeBadge(userId, badgeId);
      res.json({ message: 'Badge removed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove badge' });
    }
  },

  // Get reputation leaderboard
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { period = 'all', limit = 10 } = req.query;
      const leaderboard = await reputationService.getLeaderboard(
        period as string,
        Number(limit)
      );
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  },

  // Get reputation statistics
  async getReputationStats(req: Request, res: Response) {
    try {
      const stats = await reputationService.getReputationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get reputation statistics' });
    }
  },

  // Calculate reputation points for user (admin only)
  async calculateReputation(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const calculation = await reputationService.calculateReputation(userId);
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate reputation' });
    }
  },

  // Get trust level requirements
  async getTrustLevelRequirements(req: Request, res: Response) {
    try {
      const requirements = await reputationService.getTrustLevelRequirements();
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trust level requirements' });
    }
  }
};
