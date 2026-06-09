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
router.get("/", allowRoles("admin"), getTimetables);
router.get("/:id", allowRoles("admin"), getTimetableById);
router.post("/", allowRoles("admin"), createTimetable);
router.put("/:id", allowRoles("admin"), updateTimetable);
router.patch("/:id/status", allowRoles("admin"), updateTimetableStatus);
router.delete("/:id", allowRoles("admin"), deleteTimetable);

export default router;
