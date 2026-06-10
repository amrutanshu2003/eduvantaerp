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
import {
  getSuperAdmins,
  createSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
} from "../controllers/superAdminUserController.js";
import {
  listRecycleBinItems,
  restoreRecycleBinItem,
  permanentlyDeleteRecycleBinItem,
} from "../controllers/recycleBinController.js";
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

// Superadmin superadmin management routes
router.route("/superadmins")
  .get(allowRoles("superadmin"), getSuperAdmins)
  .post(allowRoles("superadmin"), createSuperAdmin);

router.route("/superadmins/:id")
  .put(allowRoles("superadmin"), updateSuperAdmin)
  .delete(allowRoles("superadmin"), deleteSuperAdmin);

router.get("/recycle-bin", listRecycleBinItems);
router.patch("/recycle-bin/:entityType/:id/restore", restoreRecycleBinItem);
router.delete("/recycle-bin/:entityType/:id/permanent", permanentlyDeleteRecycleBinItem);

export default router;
