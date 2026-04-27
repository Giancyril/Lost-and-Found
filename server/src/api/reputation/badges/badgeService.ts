import { PrismaClient } from '@prisma/client';
import { redis } from '../../utils/redis';

const prisma = new PrismaClient();

export const badgeService = {
  // Get all badge definitions
  async getBadgeDefinitions() {
    const cached = await redis.get('badges:definitions');
    if (cached) return JSON.parse(cached);

    const definitions = await prisma.badgeDefinition.findMany({
      where: { isActive: true },
      orderBy: { unlockPoints: 'asc' }
    });

    await redis.setex('badges:definitions', 3600, JSON.stringify(definitions));
    return definitions;
  },

  // Create badge definition (admin only)
  async createBadgeDefinition(data: {
    name: string;
    description: string;
    icon: string;
    unlockPoints: number;
    category: string;
  }) {
    const badge = await prisma.badgeDefinition.create({ data });
    await redis.del('badges:definitions');
    return badge;
  },

  // Award badge to user
  async awardBadge(userId: string, badgeId: string, badgeData?: any) {
    // Check if user already has this badge
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId }
      }
    });

    if (existingBadge) throw new Error('User already has this badge');

    const badge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        badgeData: badgeData || {}
      },
      include: { badge: true }
    });

    await redis.del(`reputation:${userId}`);
    return badge;
  },

  // Remove badge from user
  async removeBadge(userId: string, badgeId: string) {
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: { userId, badgeId }
      }
    });
    await redis.del(`reputation:${userId}`);
  },

  // Auto-check and award badges based on reputation
  async checkEligibleBadges(userId: string, points: number) {
    const allBadges = await this.getBadgeDefinitions();
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    });

    const userBadgeIds = new Set(userBadges.map(b => b.badgeId));
    const newlyAwarded = [];

    for (const badge of allBadges) {
      if (!userBadgeIds.has(badge.id) && points >= badge.unlockPoints) {
        try {
          const awarded = await this.awardBadge(userId, badge.id);
          newlyAwarded.push(awarded);
        } catch (e) {
          // Skip if error (e.g. race condition)
        }
      }
    }

    return newlyAwarded;
  }
};
