import asyncHandler from "express-async-handler";
import Drone from "../models/droneModel.js";
import droneSimulationService from "../services/droneSimulationService.js";

const getDrones = asyncHandler(async (req, res) => {
  const drones = await Drone.find({ user: req.user.id });
  res.status(200).json(drones);
});

const createDrone = asyncHandler(async (req, res) => {
  const { serialNumber, model, location, batteryLevel, status } = req.body;

  if (!serialNumber || !model || !location) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  const drone = await Drone.create({
    user: req.user.id,
    serialNumber,
    model,
    location,
    batteryLevel,
    status,
  });

  res.status(201).json(drone);
});

const updateDrone = asyncHandler(async (req, res) => {
  const drone = await Drone.findById(req.params.id);

  if (!drone) {
    res.status(404);
    throw new Error("Drone not found");
  }

  // Ensure the logged-in user owns the drone
  if (drone.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  const updatedDrone = await Drone.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Returns the updated document
  });

  // Notify simulation service about manual update
  if (droneSimulationService.getStatus().isRunning) {
    droneSimulationService.handleManualUpdate(req.params.id);
  }

  res.status(200).json(updatedDrone);
});

const deleteDrone = asyncHandler(async (req, res) => {
  const drone = await Drone.findById(req.params.id);

  if (!drone) {
    res.status(404);
    throw new Error("Drone not found");
  }

  if (drone.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  await drone.deleteOne();
  res.status(200).json({ message: "Drone removed" });
});

export { getDrones, createDrone, updateDrone, deleteDrone };
