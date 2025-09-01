import asyncHandler from "express-async-handler";
import Mission from "../models/missionModel.js";
import Drone from "../models/droneModel.js";

const getMissions = asyncHandler(async (req, res) => {
  const missions = await Mission.find({ user: req.user.id }).populate(
    "drone",
    "serialNumber model status",
  );
  res.status(200).json(missions);
});

const createMission = asyncHandler(async (req, res) => {
  const { name, description, drone, flightPath, config } = req.body;

  if (!name || !drone || !flightPath || flightPath.length === 0) {
    res.status(400);
    throw new Error("Please provide a name, drone, and a valid flight path.");
  }

  const assignedDrone = await Drone.findById(drone);
  if (!assignedDrone) {
    res.status(404);
    throw new Error("Assigned drone not found.");
  }

  if (assignedDrone.status !== "available") {
    res.status(400);
    throw new Error(
      `Drone status is ${assignedDrone.status}. Must be available to start a mission.`,
    );
  }

  const mission = await Mission.create({
    user: req.user.id,
    drone,
    name,
    description,
    flightPath,
    config,
    status: "planned",
  });

  res.status(201).json(mission);
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
