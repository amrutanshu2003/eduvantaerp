import express from "express";
import {
  getAdminPhase4Stats,
  getParentPhase4Stats,
  getStaffPhase4Stats,
  getStudentPhase4Stats,
  getTeacherPhase4Stats,
} from "../controllers/phase4DashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/admin", allowRoles("admin", "superadmin"), getAdminPhase4Stats);
router.get("/teacher", allowRoles("teacher"), getTeacherPhase4Stats);
router.get("/student", allowRoles("student"), getStudentPhase4Stats);
router.get("/parent", allowRoles("parent"), getParentPhase4Stats);
router.get("/staff", allowRoles("staff"), getStaffPhase4Stats);

export default router;
