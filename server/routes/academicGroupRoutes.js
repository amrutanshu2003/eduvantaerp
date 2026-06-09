import express from "express";
import {
  createAcademicGroup,
  deleteAcademicGroup,
  getAcademicGroupById,
  getAcademicGroups,
  updateAcademicGroup,
  updateAcademicGroupStatus,
} from "../controllers/academicGroupController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(allowRoles("admin", "superadmin"), createAcademicGroup)
  .get(allowRoles("admin", "superadmin", "teacher"), getAcademicGroups);

router.route("/:id")
  .get(allowRoles("admin", "superadmin", "teacher"), getAcademicGroupById)
  .put(allowRoles("admin", "superadmin"), updateAcademicGroup)
  .delete(allowRoles("admin", "superadmin"), deleteAcademicGroup);

router.patch("/:id/status", allowRoles("admin", "superadmin"), updateAcademicGroupStatus);

export default router;
