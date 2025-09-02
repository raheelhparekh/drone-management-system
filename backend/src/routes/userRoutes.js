import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", protect, logoutUser)

export default router;
