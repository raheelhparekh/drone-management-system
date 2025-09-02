import mongoose from "mongoose";

const droneSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    model: {
      type: String,
      required: [true, "Please add a model"],
    },
    serialNumber: {
      type: String,
      required: [true, "Please add a serial number"],
      unique: true,
    },
    battery: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      required: true,
      enum: ["available", "in-mission", "maintenance", "charging", "error"],
      default: "available",
    },
    location: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      altitude: {
        type: Number,
        default: null,
      },
    },
    // Enhanced drone capabilities
    specifications: {
      maxAltitude: {
        type: Number,
        default: 500 // meters
      },
      maxSpeed: {
        type: Number,
        default: 15 // m/s
      },
      batteryCapacity: {
        type: Number,
        default: 5000 // mAh
      },
      maxFlightTime: {
        type: Number,
        default: 30 // minutes
      },
      payload: {
        type: String,
        default: "Camera"
      },
      weatherResistance: {
        type: String,
        enum: ["none", "light", "moderate", "heavy"],
        default: "light"
      }
    },
    // Real-time telemetry
    telemetry: {
      speed: {
        type: Number,
        default: 0
      },
      heading: {
        type: Number,
        default: 0 // degrees
      },
      temperature: {
        type: Number,
        default: 20 // celsius
      },
      signalStrength: {
        type: Number,
        default: 100 // percentage
      },
      gpsAccuracy: {
        type: Number,
        default: 3 // meters
      },
      lastUpdate: {
        type: Date,
        default: Date.now
      }
    },
    // Mission assignment
    currentMission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      default: null
    },
    // Flight statistics
    totalStats: {
      totalFlightTime: {
        type: Number,
        default: 0 // minutes
      },
      totalDistance: {
        type: Number,
        default: 0 // meters
      },
      totalMissions: {
        type: Number,
        default: 0
      },
      lastMaintenance: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true,
  },
);

const Drone = mongoose.model("Drone", droneSchema);

export default Drone;
