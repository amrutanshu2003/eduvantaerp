import express from "express";
import { getProfile, loginUser, forgotPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getProfile);
router.put("/change-password", protect, changePassword);

export default router;
