import express from "express";
import {
  getMissions,
  createMission,
  updateMission,
  deleteMission,
} from "../controllers/missionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getMissions).post(protect, createMission);

router.route("/:id").put(protect, updateMission).delete(protect, deleteMission);

export default router;
