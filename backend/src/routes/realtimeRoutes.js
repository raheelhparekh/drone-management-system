import express from 'express';
import { updateMissionProgress } from '../controllers/realtimeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/missions/:id', protect, updateMissionProgress);

export default router;