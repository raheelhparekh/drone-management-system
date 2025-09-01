import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    drone: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Drone",
    },
    // Mission configuration
    name: {
      type: String,
      required: [true, "Please add a mission name"],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["planned", "in-progress", "paused", "completed", "aborted"],
      default: "planned",
    },
    // Array of coordinates representing the flight path or waypoints
    flightPath: [
      {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
        altitude: {
          type: Number,
          required: true,
        },
      },
    ],
    // Progress of the mission in percentage
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Estimated time remaining in minutes
    estimatedTimeRemaining: {
      type: Number,
      default: 0,
    },
    // Start and end times for the mission
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    // Reporting and analytics data
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    distanceCovered: {
      type: Number, // in meters
      default: 0,
    },
    // Mission-specific parameters
    config: {
      flightAltitude: {
        type: Number,
        default: 50, // default in meters
      },
      overlapPercentage: {
        type: Number,
        default: 70, // default
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Mission = mongoose.model("Mission", missionSchema);

export default Mission;
