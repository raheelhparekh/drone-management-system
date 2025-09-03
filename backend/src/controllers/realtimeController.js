import asyncHandler from 'express-async-handler';
import Mission from '../models/missionModel.js';
import { io } from '../server.js'; // Import the Socket.IO instance

const updateMissionProgress = asyncHandler(async (req, res) => {
  const { progress, latitude, longitude } = req.body;

  const mission = await Mission.findById(req.params.id);

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found.');
  }

  // Ensure user ownership
  if (mission.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized.');
  }

  mission.progress = progress;
  mission.drone.location = { latitude, longitude }; // Update drone location
  await mission.save();

  // Emit a Socket.IO event with the updated mission data
  io.emit('missionUpdate', mission);

  res.status(200).json(mission);
});

export { updateMissionProgress };