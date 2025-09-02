import asyncHandler from 'express-async-handler';
import Mission from '../models/missionModel.js';
import Drone from '../models/droneModel.js';
import { io } from '../server.js'; // Import the Socket.IO instance

// Update mission progress and emit real-time event
const updateMissionProgress = asyncHandler(async (req, res) => {
  const { status, currentWaypoint } = req.body;

  const mission = await Mission.findById(req.params.id).populate('assignedDrone');

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found.');
  }

  // Ensure user ownership
  if (mission.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized.');
  }

  // Update mission data
  if (status) mission.status = status;
  if (currentWaypoint !== undefined) mission.currentWaypoint = currentWaypoint;

  await mission.save();

  // Emit real-time mission update
  io.to(`user_${req.user.id}`).emit('missionUpdate', {
    type: 'mission_update',
    mission: mission,
    timestamp: new Date()
  });

  res.status(200).json(mission);
});

// Update drone location and status
const updateDroneStatus = asyncHandler(async (req, res) => {
  const { location, battery, status } = req.body;

  const drone = await Drone.findById(req.params.id);

  if (!drone) {
    res.status(404);
    throw new Error('Drone not found.');
  }

  // Ensure user ownership
  if (drone.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized.');
  }

  // Update drone data
  if (location) drone.location = location;
  if (battery !== undefined) drone.battery = battery;
  if (status) drone.status = status;

  await drone.save();

  // Emit real-time drone update
  io.to(`user_${req.user.id}`).emit('droneUpdate', {
    type: 'drone_update',
    drone: drone,
    timestamp: new Date()
  });

  // If drone is assigned to a mission, also emit mission update
  const activeMission = await Mission.findOne({
    assignedDrone: drone._id,
    status: { $in: ['active', 'pending'] }
  });

  if (activeMission) {
    io.to(`user_${req.user.id}`).emit('missionUpdate', {
      type: 'mission_drone_update',
      mission: activeMission,
      drone: drone,
      timestamp: new Date()
    });
  }

  res.status(200).json(drone);
});

// Simulate mission progress (for testing/demo purposes)
const simulateMissionProgress = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id).populate('assignedDrone');

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found.');
  }

  if (mission.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized.');
  }

  // Start simulation - update status to active
  mission.status = 'active';
  await mission.save();

  // Emit initial status update
  io.to(`user_${req.user.id}`).emit('missionUpdate', {
    type: 'mission_progress',
    mission: mission,
    timestamp: new Date()
  });

  // Simulate mission progress over time
  let step = 0;
  const totalSteps = 5;
  const interval = setInterval(async () => {
    step++;
    
    if (step >= totalSteps) {
      mission.status = 'completed';
      clearInterval(interval);
      
      await mission.save();
      
      // Mission completed
      io.to(`user_${req.user.id}`).emit('missionUpdate', {
        type: 'mission_completed',
        mission: mission,
        timestamp: new Date()
      });
    } else {
      // Emit progress update
      io.to(`user_${req.user.id}`).emit('missionUpdate', {
        type: 'mission_progress',
        mission: mission,
        step: step,
        totalSteps: totalSteps,
        timestamp: new Date()
      });
    }
  }, 3000); // Update every 3 seconds

  res.status(200).json({ message: 'Mission simulation started', missionId: mission._id });
});

export { updateMissionProgress, updateDroneStatus, simulateMissionProgress };