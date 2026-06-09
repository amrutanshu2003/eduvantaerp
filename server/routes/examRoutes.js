import express from "express";
import {
  createExam,
  deleteExam,
  getExamById,
  getExams,
  updateExam,
  updateExamStatus,
} from "../controllers/examController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("admin", "superadmin", "teacher"), getExams);
router.get("/:id", allowRoles("admin", "superadmin", "teacher"), getExamById);
router.post("/", allowRoles("admin", "superadmin"), createExam);
router.put("/:id", allowRoles("admin", "superadmin"), updateExam);
router.patch("/:id/status", allowRoles("admin", "superadmin"), updateExamStatus);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteExam);

export default router;
