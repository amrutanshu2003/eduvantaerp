import express from "express";
import {
  getPublicSettings,
  getGlobalSettings,
  updateGlobalSettings,
  getInstituteSettings,
  updateInstituteSettings,
  resetToGlobal as resetERPToGlobal,
} from "../controllers/erpSettingsController.js";
import {
  getGlobalLabelSettings,
  updateGlobalLabelSettings,
  getInstituteLabelSettings,
  updateInstituteLabelSettings,
  resetToGlobal as resetLabelToGlobal,
} from "../controllers/labelSettingsController.js";
import {
  getGlobalModuleSettings,
  updateGlobalModuleSettings,
  getInstituteModuleSettings,
  updateInstituteModuleSettings,
  resetToGlobal as resetModuleToGlobal,
} from "../controllers/moduleSettingsController.js";
import {
  getGlobalFormSettings,
  updateGlobalFormSettings,
  getInstituteFormSettings,
  updateInstituteFormSettings,
  resetToGlobal as resetFormToGlobal,
} from "../controllers/formSettingsController.js";
import {
  getGlobalAcademicSettings,
  updateGlobalAcademicSettings,
  resetGlobalTemplate,
  getAcademicSettings,
  updateAcademicSettings,
  resetTemplate,
  resetToGlobal as resetAcademicToGlobal,
} from "../controllers/academicSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public settings (no auth required)
router.get("/public", getPublicSettings);

// Global settings routes (Super Admin only)
router.use(protect);

router.route("/global/erp")
  .get(allowRoles("superadmin"), getGlobalSettings)
  .put(allowRoles("superadmin"), updateGlobalSettings);

router.route("/global/labels")
  .get(allowRoles("superadmin"), getGlobalLabelSettings)
  .put(allowRoles("superadmin"), updateGlobalLabelSettings);

router.route("/global/modules")
  .get(allowRoles("superadmin"), getGlobalModuleSettings)
  .put(allowRoles("superadmin"), updateGlobalModuleSettings);

router.route("/global/forms/:entity")
  .get(allowRoles("superadmin"), getGlobalFormSettings)
  .put(allowRoles("superadmin"), updateGlobalFormSettings);

router.route("/global/academic")
  .get(allowRoles("superadmin"), getGlobalAcademicSettings)
  .put(allowRoles("superadmin"), updateGlobalAcademicSettings);

router.post("/global/erp/reset", allowRoles("superadmin"), resetERPToGlobal);
router.post("/global/labels/reset", allowRoles("superadmin"), resetLabelToGlobal);
router.post("/global/modules/reset", allowRoles("superadmin"), resetModuleToGlobal);
router.post("/global/forms/:entity/reset", allowRoles("superadmin"), resetFormToGlobal);
router.post("/global/academic/reset", allowRoles("superadmin"), resetGlobalTemplate);

// Institute settings routes (Admin and Super Admin)
router.route("/institute/erp")
  .get(allowRoles("admin", "superadmin"), getInstituteSettings)
  .put(allowRoles("admin", "superadmin"), updateInstituteSettings);

router.route("/institute/labels")
  .get(allowRoles("admin", "superadmin"), getInstituteLabelSettings)
  .put(allowRoles("admin", "superadmin"), updateInstituteLabelSettings);

router.route("/institute/modules")
  .get(allowRoles("admin", "superadmin"), getInstituteModuleSettings)
  .put(allowRoles("admin", "superadmin"), updateInstituteModuleSettings);

router.route("/institute/forms/:entity")
  .get(allowRoles("admin", "superadmin"), getInstituteFormSettings)
  .put(allowRoles("admin", "superadmin"), updateInstituteFormSettings);

router.route("/institute/academic")
  .get(allowRoles("admin", "superadmin"), getAcademicSettings)
  .put(allowRoles("admin", "superadmin"), updateAcademicSettings);

router.post("/institute/erp/reset", allowRoles("admin", "superadmin"), resetERPToGlobal);
router.post("/institute/labels/reset", allowRoles("admin", "superadmin"), resetLabelToGlobal);
router.post("/institute/modules/reset", allowRoles("admin", "superadmin"), resetModuleToGlobal);
router.post("/institute/forms/:entity/reset", allowRoles("admin", "superadmin"), resetFormToGlobal);
router.post("/institute/academic/reset", allowRoles("admin", "superadmin"), resetTemplate);
router.post("/institute/academic/reset-to-global", allowRoles("admin", "superadmin"), resetAcademicToGlobal);

export default router;
