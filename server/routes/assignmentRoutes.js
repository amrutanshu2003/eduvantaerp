import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  getAssignmentSubmissions,
  getChildAssignments,
  getMyAssignments,
  reviewAssignmentSubmission,
  submitAssignment,
  updateAssignment,
  updateAssignmentStatus,
} from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-assignments", allowRoles("student"), getMyAssignments);
router.get("/child/:studentId", allowRoles("parent"), getChildAssignments);
router.get("/:id/submissions", allowRoles("admin", "superadmin", "teacher"), getAssignmentSubmissions);
router.post("/:id/submit", allowRoles("student"), submitAssignment);
router.patch("/submissions/:submissionId/review", allowRoles("admin", "superadmin", "teacher"), reviewAssignmentSubmission);
router.get("/", allowRoles("admin", "superadmin", "teacher"), getAssignments);
router.get("/:id", allowRoles("admin", "superadmin", "teacher", "student"), getAssignmentById);
router.post("/", allowRoles("admin", "superadmin", "teacher"), createAssignment);
router.put("/:id", allowRoles("admin", "superadmin", "teacher"), updateAssignment);
router.patch("/:id/status", allowRoles("admin", "superadmin", "teacher"), updateAssignmentStatus);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteAssignment);

export default router;
