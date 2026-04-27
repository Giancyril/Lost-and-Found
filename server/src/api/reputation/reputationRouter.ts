import { Router } from 'express';
import { reputationController } from './reputationController';
import auth from '../../app/midddlewares/auth';

import badgeRouter from './badges/badgeRouter';

const router = Router();

// Mount badge sub-router
router.use('/badges-management', badgeRouter);

// Apply authentication middleware for existing routes
router.use(auth());

// Get user reputation
router.get('/user/:userId', reputationController.getUserReputation);

// Get user reputation history
router.get('/user/:userId/history', reputationController.getReputationHistory);

// Get user badges
router.get('/user/:userId/badges', reputationController.getUserBadges);

// Get all users by reputation ranking
router.get('/ranking', reputationController.getReputationRanking);

// Update user reputation (admin only)
router.put('/user/:userId', reputationController.updateUserReputation);

// Award badge to user (admin only)
router.post('/user/:userId/badges', reputationController.awardBadge);

// Remove badge from user (admin only)
router.delete('/user/:userId/badges/:badgeId', reputationController.removeBadge);

// Get reputation leaderboard
router.get('/leaderboard', reputationController.getLeaderboard);

// Get reputation statistics
router.get('/stats', reputationController.getReputationStats);

// Calculate reputation points for user (admin only)
router.post('/calculate/:userId', reputationController.calculateReputation);

// Get trust level requirements
router.get('/trust-levels', reputationController.getTrustLevelRequirements);

export default router;
