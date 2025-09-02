import express from 'express';
import { 
  updateMissionProgress, 
  updateDroneStatus, 
  simulateMissionProgress 
} from '../controllers/realtimeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mission real-time updates
router.put('/missions/:id/progress', protect, updateMissionProgress);
router.put('/missions/:id/simulate', protect, simulateMissionProgress);

// Drone real-time updates  
router.put('/drones/:id/status', protect, updateDroneStatus);

export default router;