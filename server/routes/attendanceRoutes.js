import express from "express";
import {
  createAttendance,
  deleteAttendance,
  getAcademicGroupAttendanceReport,
  getAttendance,
  getAttendanceById,
  getChildAttendance,
  getMyAttendance,
  getStudentAttendanceReport,
  updateAttendance,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/reports/academic-group/:academicGroupId", allowRoles("admin", "superadmin", "teacher"), getAcademicGroupAttendanceReport);
router.get("/reports/student/:studentId", allowRoles("admin", "superadmin", "teacher"), getStudentAttendanceReport);
router.get("/reports/my-attendance", allowRoles("student"), getMyAttendance);
router.get("/reports/child/:studentId", allowRoles("parent"), getChildAttendance);

router.get("/", allowRoles("admin", "superadmin", "teacher"), getAttendance);
router.get("/:id", allowRoles("admin", "superadmin", "teacher"), getAttendanceById);
router.post("/", allowRoles("admin", "superadmin", "teacher"), createAttendance);
router.put("/:id", allowRoles("admin", "superadmin", "teacher"), updateAttendance);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteAttendance);

export default router;
