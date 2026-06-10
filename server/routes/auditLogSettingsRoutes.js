import express from "express";
import {
  getAuditLogSettings,
  updateAuditLogSettings,
  deleteAuditLogs,
  runAutoDelete,
} from "../controllers/auditLogSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/settings", protect, allowRoles("superadmin"), getAuditLogSettings);
router.put("/settings", protect, allowRoles("superadmin"), updateAuditLogSettings);
router.post("/delete", protect, allowRoles("superadmin"), deleteAuditLogs);
router.post("/auto-delete", protect, allowRoles("superadmin"), runAutoDelete);

export default router;
