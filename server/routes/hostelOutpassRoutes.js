import express from "express";
import {
  cancelHostelOutpass,
  createHostelOutpass,
  deleteHostelOutpass,
  getChildHostelOutpasses,
  getHostelOutpassById,
  getHostelOutpasses,
  getMyHostelOutpasses,
  updateParentApproval,
  updateWardenApproval,
} from "../controllers/hostelWorkflowController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireHostelManager, requireHostelWorkflowViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.route("/").post(allowRoles("student"), createHostelOutpass).get(requireHostelWorkflowViewer, getHostelOutpasses);
router.get("/my-outpasses", allowRoles("student"), getMyHostelOutpasses);
router.get("/child/:studentId", allowRoles("parent"), getChildHostelOutpasses);
router.get("/:id", getHostelOutpassById);
router.patch("/:id/parent-approval", allowRoles("parent"), updateParentApproval);
router.patch("/:id/warden-approval", requireHostelManager, updateWardenApproval);
router.patch("/:id/cancel", allowRoles("student"), cancelHostelOutpass);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteHostelOutpass);

export default router;
