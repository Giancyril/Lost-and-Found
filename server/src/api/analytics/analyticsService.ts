import { PrismaClient } from '@prisma/client';
import { redis } from '../utils/redis';

const prisma = new PrismaClient();

export const analyticsService = {
  // Get metrics cards
  async getMetrics(dateRange?: string, period?: string) {
    const cacheKey = `analytics:metrics:${dateRange || 'default'}:${period || 'default'}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dateFilter = this.getDateFilter(dateRange);
    
    const [
      totalThreads,
      totalReplies,
      totalUsers,
      activeUsers,
      totalLostItems,
      totalFoundItems,
      itemRecoveryRate,
      userEngagementRate
    ] = await Promise.all([
      prisma.discussionThread.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
      }),
      prisma.threadReply.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
      }),
      prisma.user.count(),
      prisma.user.count({
        where: dateFilter ? { lastLogin: { gte: dateFilter } } : {}
      }),
      prisma.lostItem.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
      }),
      prisma.lostItem.count({
        where: { 
          ...dateFilter ? { createdAt: { gte: dateFilter } } : {},
          isFound: true 
        }
      }),
      this.calculateItemRecoveryRate(dateFilter),
      this.calculateUserEngagementRate(dateFilter)
    ]);

    const metrics = {
      totalThreads,
      totalReplies,
      totalUsers,
      activeUsers,
      totalLostItems,
      totalFoundItems,
      itemRecoveryRate,
      userEngagementRate,
      period: period || 'all',
      dateRange: dateRange || 'all'
    };

    await redis.setex(cacheKey, 300, JSON.stringify(metrics));
    return metrics;
  },

  // Get trend reports
  async getTrends(metrics: string[], dateRange?: string, comparisonPeriod?: string) {
    const cacheKey = `analytics:trends:${metrics.join(',')}:${dateRange || 'default'}:${comparisonPeriod || 'default'}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dateFilter = this.getDateFilter(dateRange);
    const comparisonFilter = this.getDateFilter(comparisonPeriod);

    const trends = await Promise.all(
      metrics.map(async (metric) => {
        const [current, previous] = await Promise.all([
          this.getMetricData(metric, dateFilter),
          this.getMetricData(metric, comparisonFilter)
        ]);

        return {
          metric,
          current: current,
          previous: previous,
          change: this.calculateChange(current, previous),
          trend: this.calculateTrend(current, previous)
        };
      })
    );

    await redis.setex(cacheKey, 600, JSON.stringify(trends));
    return trends;
  },

  // Get geographic data
  async getGeographic(dateRange?: string) {
    const cacheKey = `analytics:geographic:${dateRange || 'default'}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dateFilter = this.getDateFilter(dateRange);
    
    const [
      locationThreads,
      locationReplies,
      locationLostItems,
      locationFoundItems,
      locationUsers
    ] = await Promise.all([
      prisma.discussionThread.groupBy({
        by: ['location'],
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
        _count: { id: true },
        having: { location: { not: null } }
      }),
      prisma.threadReply.groupBy({
        by: ['location'],
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
        _count: { id: true },
        having: { location: { not: null } }
      }),
      prisma.lostItem.groupBy({
        by: ['location'],
        where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
        _count: { id: true },
        having: { location: { not: null } }
      }),
      prisma.lostItem.groupBy({
        by: ['location'],
        where: { 
          ...dateFilter ? { createdAt: { gte: dateFilter } } : {},
          isFound: true 
        },
        _count: { id: true },
        having: { location: { not: null } }
      }),
      prisma.user.groupBy({
        by: ['location'],
        _count: { id: true },
        having: { location: { not: null } }
      })
    ]);

    // Combine geographic data
    const geographicData = this.combineGeographicData({
      locationThreads,
      locationReplies,
      locationLostItems,
      locationFoundItems,
      locationUsers
    });

    await redis.setex(cacheKey, 600, JSON.stringify(geographicData));
    return geographicData;
  },

  // Get exports
  async getExports(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [exports, total] = await Promise.all([
      prisma.analyticsExport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.analyticsExport.count()
    ]);

    return {
      exports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Create export job
  async createExport(exportName: string, exportType: string, exportFormat: string, dateRange: string, createdBy: string) {
    const exportJob = await prisma.analyticsExport.create({
      data: {
        exportName,
        exportType,
        exportFormat,
        dateRange,
        createdBy,
        exportStatus: 'pending'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Start export job in background
    this.processExportJob(exportJob.id).catch(console.error);

    return exportJob;
  },

  // Get alerts
  async getAlerts(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    
    const [alerts, total] = await Promise.all([
      prisma.analyticsAlert.findMany({
        where: status ? { isActive: status === 'active' } : {},
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.analyticsAlert.count({
        where: status ? { isActive: status === 'active' } : {}
      })
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Create alert
  async createAlert(alertName: string, alertType: string, thresholdValue: number, metricName: string) {
    return await prisma.analyticsAlert.create({
      data: {
        alertName,
        alertType,
        thresholdValue,
        metricName,
        isActive: true
      }
    });
  },

  // Update alert
  async updateAlert(id: string, updates: any) {
    return await prisma.analyticsAlert.update({
      where: { id },
      data: updates
    });
  },

  // Delete alert
  async deleteAlert(id: string) {
    return await prisma.analyticsAlert.delete({
      where: { id }
    });
  },

  // Get analytics statistics
  async getStats() {
    const [
      totalExports,
      activeAlerts,
      totalMetrics,
      recentActivity
    ] = await Promise.all([
      prisma.analyticsExport.count(),
      prisma.analyticsAlert.count({
        where: { isActive: true }
      }),
      prisma.analyticsMetric.count(),
      this.getRecentActivity()
    ]);

    return {
      totalExports,
      activeAlerts,
      totalMetrics,
      recentActivity
    };
  },

  // Process export job (background task)
  async processExportJob(exportId: string) {
    try {
      // Update export status to processing
      await prisma.analyticsExport.update({
        where: { id: exportId },
        data: { exportStatus: 'processing' }
      });

      const export = await prisma.analyticsExport.findUnique({
        where: { id: exportId }
      });

      if (!export) {
        throw new Error('Export not found');
      }

      // Generate export data based on type
      const data = await this.generateExportData(export.exportType, export.dateRange);
      
      // Save export file
      const filePath = await this.saveExportFile(data, export.exportFormat, export.exportName);
      
      // Update export status to completed
      await prisma.analyticsExport.update({
        where: { id: exportId },
        data: {
          exportStatus: 'completed',
          filePath,
          completedAt: new Date()
        }
      });

    } catch (error) {
      // Update export status to failed
      await prisma.analyticsExport.update({
        where: { id: exportId },
        data: { exportStatus: 'failed' }
      });
      console.error('Export job failed:', error);
    }
  },

  // Generate export data
  async generateExportData(exportType: string, dateRange: string) {
    const dateFilter = this.getDateFilter(dateRange);
    
    switch (exportType) {
      case 'threads':
        return await prisma.discussionThread.findMany({
          where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            replies: true
          }
        });
      case 'users':
        return await prisma.user.findMany({
          include: {
            reputation: true,
            badges: true
          }
        });
      case 'reputation':
        return await prisma.userReputation.findMany({
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });
      default:
        throw new Error('Unknown export type');
    }
  },

  // Save export file
  async saveExportFile(data: any, format: string, name: string): Promise<string> {
    // This would implement actual file saving logic
    // For now, return a mock file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `/exports/${name}_${timestamp}.${format}`;
  },

  // Get recent activity
  async getRecentActivity() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const [
      recentThreads,
      recentReplies,
      recentUsers
    ] = await Promise.all([
      prisma.discussionThread.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      prisma.threadReply.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: oneDayAgo } }
      })
    ]);

    return {
      recentThreads,
      recentReplies,
      recentUsers
    };
  },

  // Helper methods
  getDateFilter(dateRange?: string): Date | null {
    if (!dateRange || dateRange === 'all') return null;
    
    const date = new Date();
    switch (dateRange) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        return date;
      case 'week':
        date.setDate(date.getDate() - 7);
        return date;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        return date;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        return date;
      default:
        return new Date(dateRange);
    }
  },

  calculateItemRecoveryRate(dateFilter?: Date): number {
    // This would calculate the actual recovery rate
    // For now, return a mock value
    return 0.75;
  },

  calculateUserEngagementRate(dateFilter?: Date): number {
    // This would calculate the actual engagement rate
    // For now, return a mock value
    return 0.65;
  },

  async getMetricData(metric: string, dateFilter?: Date): Promise<number> {
    switch (metric) {
      case 'threads':
        return await prisma.discussionThread.count({
          where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
        });
      case 'replies':
        return await prisma.threadReply.count({
          where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
        });
      case 'users':
        return await prisma.user.count({
          where: dateFilter ? { createdAt: { gte: dateFilter } } : {}
        });
      default:
        return 0;
    }
  },

  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = this.calculateChange(current, previous);
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  },

  combineGeographicData(data: any): any[] {
    // Combine all geographic data into a unified format
    const locations = new Set();
    
    // Collect all unique locations
    Object.values(data).forEach((item: any) => {
      if (Array.isArray(item)) {
        item.forEach((locationData: any) => {
          if (locationData.location) {
            locations.add(locationData.location);
          }
        });
      }
    });

    // Create combined data for each location
    return Array.from(locations).map((location: string) => {
      const locationData = location as string;
      
      const threadData = data.locationThreads.find((item: any) => item.location === locationData);
      const replyData = data.locationReplies.find((item: any) => item.location === locationData);
      const lostItemData = data.locationLostItems.find((item: any) => item.location === locationData);
      const foundItemData = data.locationFoundItems.find((item: any) => item.location === locationData);
      const userData = data.locationUsers.find((item: any) => item.location === locationData);

      return {
        location: locationData,
        threadCount: threadData?._count.id || 0,
        replyCount: replyData?._count.id || 0,
        lostItemCount: lostItemData?._count.id || 0,
        foundItemCount: foundItemData?._count.id || 0,
        userCount: userData?._count.id || 0,
        activityScore: this.calculateActivityScore({
          threadCount: threadData?._count.id || 0,
          replyCount: replyData?._count.id || 0,
          lostItemCount: lostItemData?._count.id || 0,
          foundItemCount: foundItemData?._count.id || 0,
          userCount: userData?._count.id || 0
        })
      };
    });
  },

  calculateActivityScore(data: any): number {
    // Calculate activity score based on various metrics
    const weights = {
      threads: 0.3,
      replies: 0.2,
      lostItems: 0.2,
      foundItems: 0.2,
      users: 0.1
    };

    return (
      (data.threadCount * weights.threads) +
      (data.replyCount * weights.replies) +
      (data.lostItemCount * weights.lostItems) +
      (data.foundItemCount * weights.foundItems) +
      (data.userCount * weights.users)
    );
  }
};
