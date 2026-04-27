import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../analyticsService';

const prisma = new PrismaClient();

export const metricsAggregation = {
  // Aggregate daily metrics
  async aggregateDailyMetrics() {
    console.log('📊 Starting daily metrics aggregation...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [threads, replies, users, lostItems, foundItems] = await Promise.all([
      prisma.discussionThread.count({ where: { createdAt: { gte: today } } }),
      prisma.threadReply.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.lostItem.count({ where: { createdAt: { gte: today } } }),
      prisma.lostItem.count({ where: { createdAt: { gte: today }, isFound: true } })
    ]);

    // Save to AnalyticsMetric table
    await Promise.all([
      this.saveMetric('daily_threads', threads, 'activity'),
      this.saveMetric('daily_replies', replies, 'activity'),
      this.saveMetric('daily_new_users', users, 'growth'),
      this.saveMetric('daily_lost_items', lostItems, 'items'),
      this.saveMetric('daily_found_items', foundItems, 'items')
    ]);

    console.log('✅ Daily metrics aggregation complete.');
  },

  async saveMetric(name: string, value: number, category: string) {
    return await prisma.analyticsMetric.create({
      data: {
        name: `${name}_${new Date().toISOString().split('T')[0]}`,
        value,
        category,
        recordedAt: new Date()
      }
    });
  },

  // Perform a full recalculation of all analytics (can be triggered manually)
  async fullRecalculation() {
    return await analyticsService.getStats();
  }
};
