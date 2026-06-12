import express from "express";
import {
  getProfile,
  loginUser,
  forgotPassword,
  changePassword,
  resetManagedUserPassword,
  recoverPrivilegedAccountPassword,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/secure-recovery", recoverPrivilegedAccountPassword);
router.get("/me", protect, getProfile);
router.put("/change-password", protect, changePassword);
router.put("/update-profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.put("/reset-managed-password", protect, allowRoles("admin", "superadmin"), resetManagedUserPassword);

export default router;
