import { Router } from 'express';
import { analyticsController } from './analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware
router.use(authMiddleware);

// Get metrics cards
router.get('/metrics', analyticsController.getMetrics);

// Get trend reports
router.get('/trends', analyticsController.getTrends);

// Get geographic data
router.get('/geographic', analyticsController.getGeographic);

// Get export history
router.get('/exports', analyticsController.getExports);

// Create export job
router.post('/exports', analyticsController.createExport);

// Get active alerts
router.get('/alerts', analyticsController.getAlerts);

// Create alert
router.post('/alerts', analyticsController.createAlert);

// Update alert
router.put('/alerts/:id', analyticsController.updateAlert);

// Delete alert
router.delete('/alerts/:id', analyticsController.deleteAlert);

// Get analytics statistics
router.get('/stats', analyticsController.getStats);

export default router;
