import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import droneSimulationService from '../services/droneSimulationService.js';
import { createTestMission, startTestMission } from '../utils/createTestMission.js';

const router = express.Router();

// Start simulation
router.post('/start', protect, async (req, res) => {
  try {
    const result = await droneSimulationService.startSimulation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stop simulation
router.post('/stop', protect, async (req, res) => {
  try {
    const result = droneSimulationService.stopSimulation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get simulation status
router.get('/status', protect, async (req, res) => {
  try {
    const status = droneSimulationService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create test mission with waypoints for coordinate tracking
router.post('/create-test-mission', protect, async (req, res) => {
  try {
    const result = await createTestMission(req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start test mission
router.post('/start-test-mission', protect, async (req, res) => {
  try {
    const result = await startTestMission(req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
