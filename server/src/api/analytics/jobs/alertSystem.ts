import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../analyticsService';

const prisma = new PrismaClient();

export const alertSystem = {
  // Check all active alerts against current metrics
  async checkAlerts() {
    const activeAlerts = await prisma.analyticsAlert.findMany({
      where: { isActive: true }
    });

    const results = [];

    for (const alert of activeAlerts) {
      const metricValue = await this.getCurrentMetricValue(alert.metricName);
      
      let triggered = false;
      if (alert.alertType === 'threshold_above' && metricValue > alert.thresholdValue) {
        triggered = true;
      } else if (alert.alertType === 'threshold_below' && metricValue < alert.thresholdValue) {
        triggered = true;
      }

      if (triggered) {
        console.log(`⚠️ ALERT TRIGGERED: ${alert.alertName} - Current value: ${metricValue}`);
        results.push({
          alertId: alert.id,
          alertName: alert.alertName,
          value: metricValue,
          threshold: alert.thresholdValue
        });
        
        // In a real system, this would send an email or push notification
      }
    }

    return results;
  },

  async getCurrentMetricValue(metricName: string): Promise<number> {
    const metrics = await analyticsService.getMetrics('today');
    
    // Map metric names to actual data
    const mapping: Record<string, number> = {
      'threads': metrics.totalThreads,
      'replies': metrics.totalReplies,
      'engagement': metrics.userEngagementRate,
      'recovery': metrics.itemRecoveryRate
    };

    return mapping[metricName] || 0;
  }
};
