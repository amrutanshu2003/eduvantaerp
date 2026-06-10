import express from "express";
import {
  createMarks,
  deleteMarks,
  getMarks,
  getMarksById,
  publishMarks,
  updateMarks,
  updateMarksStatus,
} from "../controllers/marksController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("admin", "superadmin", "teacher"), getMarks);
router.get("/:id", allowRoles("admin", "superadmin", "teacher"), getMarksById);
router.post("/", allowRoles("admin", "superadmin", "teacher"), createMarks);
router.put("/:id", allowRoles("admin", "superadmin", "teacher"), updateMarks);
router.patch("/:id/status", allowRoles("admin", "superadmin", "teacher"), updateMarksStatus);
router.patch("/publish", allowRoles("admin", "superadmin"), publishMarks);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteMarks);

export default router;
