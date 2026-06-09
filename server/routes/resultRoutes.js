import express from "express";
import {
  getChildResult,
  getExamAcademicGroupResults,
  getMyResult,
  getStudentResult,
} from "../controllers/marksController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/student/:studentId", allowRoles("admin", "superadmin", "teacher"), getStudentResult);
router.get("/my-result", allowRoles("student"), getMyResult);
router.get("/child/:studentId", allowRoles("parent"), getChildResult);
router.get("/exam/:examId/academic-group/:academicGroupId", allowRoles("admin", "superadmin"), getExamAcademicGroupResults);

export default router;
