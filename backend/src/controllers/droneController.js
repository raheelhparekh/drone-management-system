import asyncHandler from "express-async-handler";
import Drone from "../models/droneModel.js";

const getDrones = asyncHandler(async (req, res) => {
  const drones = await Drone.find({ user: req.user.id });
  res.status(200).json(drones);
});

const createDrone = asyncHandler(async (req, res) => {
  const { name, model, serialNumber, battery, status, location } = req.body;

  if (!name || !model || !serialNumber) {
    res.status(400);
    throw new Error("Please add all required fields: name, model, serialNumber");
  }

  const drone = await Drone.create({
    user: req.user.id,
    name,
    model,
    serialNumber,
    battery: battery || 100,
    status: status || "inactive",
    location: location || { latitude: null, longitude: null, altitude: null },
  });

  res.status(201).json(drone);
});

const updateDrone = asyncHandler(async (req, res) => {
  const drone = await Drone.findById(req.params.id);

  if (!drone) {
    res.status(404);
    throw new Error("Drone not found.");
  }

  if (drone.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized.");
  }

  const { name, model, serialNumber, battery, status, location } = req.body;

  const updatedDrone = await Drone.findByIdAndUpdate(
    req.params.id,
    {
      name,
      model,
      serialNumber,
      battery: battery || drone.battery,
      status: status || drone.status,
      location: location || drone.location,
    },
    { new: true },
  );

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
