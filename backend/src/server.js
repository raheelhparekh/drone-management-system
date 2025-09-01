import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import droneRoutes from "./routes/droneRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Use the API routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/drones", droneRoutes);
app.use("/api/v1/missions", missionRoutes);

// Define a simple test route for the root path
app.get('/', (req, res) => {
  res.send('Drone Survey Management System Backend is running!');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
