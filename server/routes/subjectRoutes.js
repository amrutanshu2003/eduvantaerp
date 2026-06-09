import express from "express";
import {
  assignTeacherToSubject,
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
  updateSubjectStatus,
} from "../controllers/subjectController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("admin", "superadmin", "teacher"), getSubjects);
router.get("/:id", allowRoles("admin", "superadmin", "teacher"), getSubjectById);
router.post("/", allowRoles("admin", "superadmin"), createSubject);
router.put("/:id", allowRoles("admin", "superadmin"), updateSubject);
router.patch("/:id/status", allowRoles("admin", "superadmin"), updateSubjectStatus);
router.patch("/:id/assign-teacher", allowRoles("admin", "superadmin"), assignTeacherToSubject);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteSubject);

export default router;
