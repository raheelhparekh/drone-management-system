import asyncHandler from "express-async-handler";
import Mission from "../models/missionModel.js";
import Drone from "../models/droneModel.js";

const getMissions = asyncHandler(async (req, res) => {
  const missions = await Mission.find({ user: req.user.id }).populate(
    "assignedDrone",
    "name model status",
  );
  res.status(200).json(missions);
});

const createMission = asyncHandler(async (req, res) => {
  const { name, description, type, priority, status, assignedDrone, waypoints } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error("Please provide name and description.");
  }

  // Validate assigned drone if provided
  if (assignedDrone) {
    const drone = await Drone.findById(assignedDrone);
    if (!drone) {
      res.status(404);
      throw new Error("Assigned drone not found.");
    }
  }

  const mission = await Mission.create({
    user: req.user.id,
    name,
    description,
    type: type || "survey",
    priority: priority || "medium",
    status: status || "pending",
    assignedDrone: assignedDrone || null,
    waypoints: waypoints || [],
  });

  const populatedMission = await Mission.findById(mission._id).populate(
    "assignedDrone",
    "name model status",
  );

  res.status(201).json(populatedMission);
});

const updateMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id);

  if (!mission) {
    res.status(404);
    throw new Error("Mission not found.");
  }

  if (mission.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized.");
  }

  const updatedMission = await Mission.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    },
  );

  res.status(200).json(updatedMission);
});

const deleteMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id);

  if (!mission) {
    res.status(404);
    throw new Error("Mission not found.");
  }

  if (mission.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized.");
  }

  await mission.deleteOne();
  res.status(200).json({ message: "Mission removed" });
});

export { getMissions, createMission, updateMission, deleteMission };
