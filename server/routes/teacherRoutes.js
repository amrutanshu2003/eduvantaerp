import express from "express";
import {
  assignAcademicGroupsToTeacher,
  createTeacher,
  deleteTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher,
  updateTeacherStatus,
} from "../controllers/teacherController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "superadmin"));

router.route("/").post(createTeacher).get(getTeachers);
router.patch("/:id/assign-academic-groups", assignAcademicGroupsToTeacher);
router.patch("/:id/status", updateTeacherStatus);
router.route("/:id").get(getTeacherById).put(updateTeacher).delete(deleteTeacher);

export default router;
