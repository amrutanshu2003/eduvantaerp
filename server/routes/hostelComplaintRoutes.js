import express from "express";
import {
  assignHostelComplaint,
  createHostelComplaint,
  deleteHostelComplaint,
  getChildHostelComplaints,
  getHostelComplaintById,
  getHostelComplaints,
  getMyHostelComplaints,
  updateHostelComplaintStatus,
} from "../controllers/hostelWorkflowController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireHostelManager, requireHostelWorkflowViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.route("/").post(allowRoles("student"), createHostelComplaint).get(requireHostelWorkflowViewer, getHostelComplaints);
router.get("/my-complaints", allowRoles("student"), getMyHostelComplaints);
router.get("/child/:studentId", allowRoles("parent"), getChildHostelComplaints);
router.get("/:id", getHostelComplaintById);
router.patch("/:id/assign", requireHostelManager, assignHostelComplaint);
router.patch("/:id/status", requireHostelManager, updateHostelComplaintStatus);
router.delete("/:id", requireHostelManager, deleteHostelComplaint);

export default router;
