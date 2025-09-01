import mongoose from "mongoose";

const droneSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    serialNumber: {
      type: String,
      required: [true, "Please add a serial number"],
      unique: true,
    },
    // The model of the drone
    model: {
      type: String,
      required: [true, "Please add a model"],
    },
    // Status of the drone (e.g., 'available', 'in-mission', 'offline', 'charging')
    status: {
      type: String,
      required: true,
      enum: ["available", "in-mission", "offline", "charging", "maintenance"],
      default: "available",
    },
    // Current battery level in percentage
    batteryLevel: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    // Current location of the drone (e.g., coordinates)
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Drone = mongoose.model("Drone", droneSchema);

export default Drone;
