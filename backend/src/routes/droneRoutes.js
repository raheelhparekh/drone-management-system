import express from "express";
import {
  getDrones,
  createDrone,
  updateDrone,
  deleteDrone,
} from "../controllers/droneController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getDrones).post(protect, createDrone);

router.route("/:id").put(protect, updateDrone).delete(protect, deleteDrone);

export default router;
