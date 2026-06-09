import express from "express";
import {
  createStaff,
  deleteStaff,
  getStaffById,
  getStaffMembers,
  updateStaff,
  updateStaffPermissions,
  updateStaffStatus,
} from "../controllers/staffController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "superadmin"));

router.route("/").post(createStaff).get(getStaffMembers);
router.patch("/:id/permissions", updateStaffPermissions);
router.patch("/:id/status", updateStaffStatus);
router.route("/:id").get(getStaffById).put(updateStaff).delete(deleteStaff);

export default router;
