import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Please add a mission name"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    type: {
      type: String,
      required: true,
      enum: ["survey", "delivery", "inspection", "mapping", "monitoring"],
      default: "survey",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in-progress", "completed", "paused", "aborted"],
      default: "pending",
    },
    assignedDrone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      default: null,
    },
    // Enhanced mission parameters for surveys
    surveyParams: {
      pattern: {
        type: String,
        enum: ["crosshatch", "perimeter", "grid", "zigzag", "circular"],
        default: "grid"
      },
      altitude: {
        type: Number,
        default: 100, // meters
      },
      speed: {
        type: Number,
        default: 10, // m/s
      },
      overlapPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 70
      },
      sideOverlap: {
        type: Number,
        min: 0,
        max: 100,
        default: 60
      },
      resolution: {
        type: Number,
        default: 5 // cm/pixel
      }
    },
    // Mission area definition
    area: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon"
      },
      coordinates: [[{
        type: Number
      }]] // GeoJSON format
    },
    waypoints: [
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
        order: {
          type: Number,
          default: 0
        }
      },
    ],
    // Real-time mission tracking
    progress: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      currentWaypoint: {
        type: Number,
        default: 0
      },
      estimatedTimeRemaining: {
        type: Number, // minutes
        default: 0
      },
      distanceCovered: {
        type: Number, // meters
        default: 0
      },
      totalDistance: {
        type: Number, // meters
        default: 0
      }
    },
    // Flight statistics
    flightStats: {
      startTime: Date,
      endTime: Date,
      duration: Number, // minutes
      maxAltitude: Number,
      minAltitude: Number,
      averageSpeed: Number,
      areaCovered: Number, // square meters
      photosCount: Number,
      batteryUsed: Number // percentage
    },
    // Live flight path tracking
    flightPath: [{
      latitude: Number,
      longitude: Number,
      altitude: Number,
      timestamp: {
        type: Date,
        default: Date.now
      },
      speed: Number,
      battery: Number
    }]
  },
  {
    timestamps: true,
  },
);

const Mission = mongoose.model("Mission", missionSchema);

export default Mission;
