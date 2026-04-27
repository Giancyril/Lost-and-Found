import { Request, Response } from 'express';
import { analyticsService } from './analyticsService';

export const analyticsController = {
  // Get metrics cards
  async getMetrics(req: Request, res: Response) {
    try {
      const { dateRange, period } = req.query;
      const metrics = await analyticsService.getMetrics(
        dateRange as string,
        period as string
      );
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  },

  // Get trend reports
  async getTrends(req: Request, res: Response) {
    try {
      const { metrics, dateRange, comparisonPeriod } = req.query;
      const trends = await analyticsService.getTrends(
        metrics as string[],
        dateRange as string,
        comparisonPeriod as string
      );
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trends' });
    }
  },

  // Get geographic data
  async getGeographic(req: Request, res: Response) {
    try {
      const { dateRange } = req.query;
      const geographic = await analyticsService.getGeographic(dateRange as string);
      res.json(geographic);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get geographic data' });
    }
  },

  // Get export history
  async getExports(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const exports = await analyticsService.getExports(
        Number(page),
        Number(limit)
      );
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get exports' });
    }
  },

  // Create export job
  async createExport(req: Request, res: Response) {
    try {
      const { exportName, exportType, exportFormat, dateRange } = req.body;
      const exportJob = await analyticsService.createExport(
        exportName,
        exportType,
        exportFormat,
        dateRange,
        req.user!.id
      );
      res.json(exportJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create export' });
    }
  },

  // Get active alerts
  async getAlerts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const alerts = await analyticsService.getAlerts(
        Number(page),
        Number(limit),
        status as string
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  },

  // Create alert
  async createAlert(req: Request, res: Response) {
    try {
      const { alertName, alertType, thresholdValue, metricName } = req.body;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const alert = await analyticsService.createAlert(
        alertName,
        alertType,
        thresholdValue,
        metricName
      );
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create alert' });
    }
  },

  // Update alert
  async updateAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { alertName, alertType, thresholdValue, metricName, isActive } = req.body;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const alert = await analyticsService.updateAlert(id, {
        alertName,
        alertType,
        thresholdValue,
        metricName,
        isActive
      });
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update alert' });
    }
  },

  // Delete alert
  async deleteAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      await analyticsService.deleteAlert(id);
      res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete alert' });
    }
  },

  // Get analytics statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get analytics statistics' });
    }
  }
};
