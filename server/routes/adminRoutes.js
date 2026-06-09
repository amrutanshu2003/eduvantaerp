import express from "express";
import { getAdminDashboardStats } from "../controllers/adminDashboardController.js";
import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
} from "../controllers/adminUserController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "superadmin"));

router.get("/dashboard-stats", getAdminDashboardStats);

// Superadmin admin management routes
router.route("/admins")
  .get(allowRoles("superadmin"), getAdmins)
  .post(allowRoles("superadmin"), createAdmin);

router.route("/admins/:id")
  .get(allowRoles("superadmin"), getAdminById)
  .put(allowRoles("superadmin"), updateAdmin)
  .delete(allowRoles("superadmin"), deleteAdmin);

router.patch("/admins/:id/status", allowRoles("superadmin"), updateAdminStatus);

export default router;
