import express from "express";
import {
  createInstitute,
  createInstituteAdmin,
  deleteInstitute,
  getInstituteById,
  getInstitutes,
  updateInstitute,
  updateInstituteStatus,
} from "../controllers/instituteController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("superadmin"));

router.route("/").post(createInstitute).get(getInstitutes);
router.post("/:id/admin", createInstituteAdmin);
router.route("/:id").get(getInstituteById).put(updateInstitute).delete(deleteInstitute);
router.patch("/:id/status", updateInstituteStatus);

export default router;
