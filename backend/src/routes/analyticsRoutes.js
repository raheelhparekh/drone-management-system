import express from 'express';
import {
  getDashboardAnalytics,
  getMissionAnalytics,
  getFleetAnalytics
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/missions', protect, getMissionAnalytics);
router.get('/fleet', protect, getFleetAnalytics);

export default router;
