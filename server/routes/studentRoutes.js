import express from "express";
import {
  assignAcademicGroupToStudent,
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
  updateStudentStatus,
  getStudentProfile,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/profile", allowRoles("student"), getStudentProfile);

router.route("/")
  .post(allowRoles("admin", "superadmin"), createStudent)
  .get(allowRoles("admin", "superadmin", "teacher"), getStudents);

router.patch("/:id/assign-academic-group", allowRoles("admin", "superadmin"), assignAcademicGroupToStudent);
router.patch("/:id/status", allowRoles("admin", "superadmin"), updateStudentStatus);

router.route("/:id")
  .get(allowRoles("admin", "superadmin", "teacher"), getStudentById)
  .put(allowRoles("admin", "superadmin"), updateStudent)
  .delete(allowRoles("admin", "superadmin"), deleteStudent);

export default router;
