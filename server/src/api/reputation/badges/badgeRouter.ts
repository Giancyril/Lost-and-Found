import { Router } from 'express';
import { badgeService } from './badgeService';
import auth from '../../../app/midddlewares/auth';

const router = Router();

// Get all badge definitions
router.get('/definitions', badgeService.getBadgeDefinitions);

// Create badge definition (admin only)
router.post('/definitions', auth(), async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const badge = await badgeService.createBadgeDefinition(req.body);
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create badge definition' });
  }
});

// Award badge to user (admin only)
router.post('/award/:userId/:badgeId', auth(), async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { userId, badgeId } = req.params;
    const badge = await badgeService.awardBadge(userId, badgeId, req.body);
    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Remove badge from user (admin only)
router.delete('/award/:userId/:badgeId', auth(), async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { userId, badgeId } = req.params;
    await badgeService.removeBadge(userId, badgeId);
    res.json({ message: 'Badge removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove badge' });
  }
});

export default router;
