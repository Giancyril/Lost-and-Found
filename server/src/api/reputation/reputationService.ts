import { PrismaClient } from '@prisma/client';
import { redis } from '../utils/redis';

const prisma = new PrismaClient();

// Point calculation rules
const POINT_RULES = {
  THREAD_CREATED: 10,
  REPLY_POSTED: 5,
  REPLY_HELPFUL: 3,
  THREAD_UPVOTE: 2,
  THREAD_DOWNVOTE: -1,
  SIGHTING_VERIFIED: 15,
  CONTENT_QUALITY: 3,
  MODERATION_ACTION: 20,
  BADGE_REPORTED: -10,
  SPAM_DETECTED: -50
};

// Trust level thresholds
const TRUST_LEVELS = {
  NEW: { min: 0, max: 49, color: 'gray' },
  TRUSTED: { min: 50, max: 499, color: 'blue' },
  EXPERT: { min: 500, max: 999, color: 'purple' },
  MASTER: { min: 1000, max: Infinity, color: 'gold' }
};

export const reputationService = {
  // Get user reputation
  async getUserReputation(userId: string) {
    const cacheKey = `reputation:${userId}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const reputation = await prisma.userReputation.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!reputation) {
      // Create default reputation for new user
      const newReputation = await this.initializeUserReputation(userId);
      await redis.setex(cacheKey, 300, JSON.stringify(newReputation));
      return newReputation;
    }

    await redis.setex(cacheKey, 300, JSON.stringify(reputation));
    return reputation;
  },

  // Initialize user reputation
  async initializeUserReputation(userId: string) {
    return await prisma.userReputation.create({
      data: {
        userId,
        helpfulPoints: 0,
        commentsCount: 0,
        verifiedSightings: 0,
        threadsCreated: 0,
        reputationPoints: 0,
        trustLevel: 'NEW'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // Get reputation history
  async getReputationHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [history, total] = await Promise.all([
      prisma.reputationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reference: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.reputationHistory.count({
        where: { userId }
      })
    ]);

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get user badges
  async getUserBadges(userId: string) {
    return await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });
  },

  // Get reputation ranking
  async getReputationRanking(limit: number, offset: number) {
    return await prisma.userReputation.findMany({
      orderBy: { reputationPoints: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // Update user reputation
  async updateUserReputation(userId: string, points: number, reason: string, referenceId?: string) {
    const reputation = await this.getUserReputation(userId);
    
    // Update reputation points
    const updatedReputation = await prisma.userReputation.update({
      where: { userId },
      data: {
        reputationPoints: reputation.reputationPoints + points,
        trustLevel: this.calculateTrustLevel(reputation.reputationPoints + points),
        lastCalculated: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Add to history
    await prisma.reputationHistory.create({
      data: {
        userId,
        actionType: reason,
        pointsChange: points,
        reason,
        referenceId
      }
    });

    // Clear cache
    await redis.del(`reputation:${userId}`);

    return updatedReputation;
  },

  // Award badge to user
  async awardBadge(userId: string, badgeId: string, badgeData?: any) {
    // Check if user already has this badge
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    if (existingBadge) {
      throw new Error('User already has this badge');
    }

    // Get badge definition
    const badge = await prisma.badgeDefinition.findUnique({
      where: { id: badgeId }
    });

    if (!badge || !badge.isActive) {
      throw new Error('Badge not found or inactive');
    }

    // Check if user meets requirements
    const userReputation = await this.getUserReputation(userId);
    if (userReputation.reputationPoints < badge.unlockPoints) {
      throw new Error('User does not meet badge requirements');
    }

    // Award badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        badgeData: badgeData || {}
      },
      include: {
        badge: true
      }
    });

    // Clear cache
    await redis.del(`reputation:${userId}`);

    return userBadge;
  },

  // Remove badge from user
  async removeBadge(userId: string, badgeId: string) {
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    if (!userBadge) {
      throw new Error('User badge not found');
    }

    await prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    // Clear cache
    await redis.del(`reputation:${userId}`);
  },

  // Get leaderboard
  async getLeaderboard(period: string, limit: number) {
    const cacheKey = `leaderboard:${period}:${limit}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let leaderboard;
    
    switch (period) {
      case 'weekly':
        leaderboard = await this.getWeeklyLeaderboard(limit);
        break;
      case 'monthly':
        leaderboard = await this.getMonthlyLeaderboard(limit);
        break;
      default:
        leaderboard = await this.getAllTimeLeaderboard(limit);
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(leaderboard));
    return leaderboard;
  },

  // Get all-time leaderboard
  async getAllTimeLeaderboard(limit: number) {
    return await prisma.userReputation.findMany({
      orderBy: { reputationPoints: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // Get weekly leaderboard
  async getWeeklyLeaderboard(limit: number) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyPoints = await prisma.reputationHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      },
      _sum: {
        pointsChange: true
      },
      orderBy: {
        _sum: {
          pointsChange: 'desc'
        }
      },
      take: limit
    });

    const userIds = weeklyPoints.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: { id: true, name: true, email: true }
    });

    return weeklyPoints.map((item, index) => ({
      rank: index + 1,
      user: users.find(u => u.id === item.userId),
      weeklyPoints: item._sum.pointsChange || 0
    }));
  },

  // Get monthly leaderboard
  async getMonthlyLeaderboard(limit: number) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyPoints = await prisma.reputationHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: oneMonthAgo
        }
      },
      _sum: {
        pointsChange: true
      },
      orderBy: {
        _sum: {
          pointsChange: 'desc'
        }
      },
      take: limit
    });

    const userIds = monthlyPoints.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: { id: true, name: true, email: true }
    });

    return monthlyPoints.map((item, index) => ({
      rank: index + 1,
      user: users.find(u => u.id === item.userId),
      monthlyPoints: item._sum.pointsChange || 0
    }));
  },

  // Get reputation statistics
  async getReputationStats() {
    const [
      totalUsers,
      totalReputationPoints,
      trustLevelDistribution,
      topBadges
    ] = await Promise.all([
      prisma.userReputation.count(),
      prisma.userReputation.aggregate({
        _sum: { reputationPoints: true }
      }),
      prisma.userReputation.groupBy({
        by: ['trustLevel'],
        _count: { trustLevel: true }
      }),
      prisma.userBadge.groupBy({
        by: ['badgeId'],
        _count: { badgeId: true },
        orderBy: {
          _count: {
            badgeId: 'desc'
          }
        },
        take: 10
      })
    ]);

    return {
      totalUsers,
      totalReputationPoints: totalReputationPoints._sum.reputationPoints || 0,
      averageReputation: totalUsers > 0 ? (totalReputationPoints._sum.reputationPoints || 0) / totalUsers : 0,
      trustLevelDistribution: trustLevelDistribution.map(item => ({
        level: item.trustLevel,
        count: item._count.trustLevel,
        percentage: totalUsers > 0 ? (item._count.trustLevel / totalUsers) * 100 : 0
      })),
      topBadges
    };
  },

  // Calculate reputation for user
  async calculateReputation(userId: string) {
    const [
      threadCount,
      replyCount,
      helpfulVotes,
      verifiedSightings,
      moderationActions
    ] = await Promise.all([
      prisma.discussionThread.count({
        where: { createdBy: userId }
      }),
      prisma.threadReply.count({
        where: { userId }
      }),
      prisma.threadReply.aggregate({
        where: { userId },
        _sum: { helpfulCount: true }
      }),
      prisma.lostItem.count({
        where: { 
          userId,
          isVerified: true 
        }
      }),
      prisma.moderationAction.count({
        where: { moderatorId: userId }
      })
    ]);

    // Calculate points
    const points = 
      (threadCount * POINT_RULES.THREAD_CREATED) +
      (replyCount * POINT_RULES.REPLY_POSTED) +
      ((helpfulVotes._sum.helpfulCount || 0) * POINT_RULES.REPLY_HELPFUL) +
      (verifiedSightings * POINT_RULES.SIGHTING_VERIFIED) +
      (moderationActions * POINT_RULES.MODERATION_ACTION);

    // Update user reputation
    const updatedReputation = await prisma.userReputation.update({
      where: { userId },
      data: {
        threadsCreated: threadCount,
        helpfulPoints: helpfulVotes._sum.helpfulCount || 0,
        verifiedSightings,
        reputationPoints: points,
        trustLevel: this.calculateTrustLevel(points),
        lastCalculated: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Clear cache
    await redis.del(`reputation:${userId}`);

    return {
      calculatedPoints: points,
      breakdown: {
        threadCount,
        replyCount,
        helpfulVotes: helpfulVotes._sum.helpfulCount || 0,
        verifiedSightings,
        moderationActions
      },
      updatedReputation
    };
  },

  // Get trust level requirements
  async getTrustLevelRequirements() {
    return TRUST_LEVELS;
  },

  // Calculate trust level based on points
  calculateTrustLevel(points: number): string {
    for (const [level, config] of Object.entries(TRUST_LEVELS)) {
      if (points >= config.min && points <= config.max) {
        return level;
      }
    }
    return 'NEW';
  },

  // Add reputation points for action
  async addReputationPoints(userId: string, action: keyof typeof POINT_RULES, referenceId?: string) {
    const points = POINT_RULES[action];
    const reason = action.replace(/_/g, ' ').toLowerCase();
    
    return await this.updateUserReputation(userId, points, reason, referenceId);
  }
};
