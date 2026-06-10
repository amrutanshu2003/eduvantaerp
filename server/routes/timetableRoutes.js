import express from "express";
import {
  createTimetable,
  deleteTimetable,
  getChildTimetable,
  getMyTimetable,
  getTeacherTimetable,
  getTimetableById,
  getTimetables,
  updateTimetable,
  updateTimetableStatus,
} from "../controllers/timetableController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-timetable", allowRoles("student"), getMyTimetable);
router.get("/teacher/my-timetable", allowRoles("teacher"), getTeacherTimetable);
router.get("/child/:studentId", allowRoles("parent"), getChildTimetable);
router.get("/", allowRoles("admin", "superadmin"), getTimetables);
router.get("/:id", allowRoles("admin", "superadmin"), getTimetableById);
router.post("/", allowRoles("admin", "superadmin"), createTimetable);
router.put("/:id", allowRoles("admin", "superadmin"), updateTimetable);
router.patch("/:id/status", allowRoles("admin", "superadmin"), updateTimetableStatus);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteTimetable);

export default router;
