import express from "express";
import {
  getAcademicSettings,
  updateAcademicSettings,
  resetTemplate,
} from "../controllers/academicSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(allowRoles("admin", "superadmin"), getAcademicSettings)
  .put(allowRoles("admin", "superadmin"), updateAcademicSettings);

router.post("/reset-template", allowRoles("admin", "superadmin"), resetTemplate);

export default router;
