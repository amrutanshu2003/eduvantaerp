import express from "express";
import {
  cancelHostelAllocation,
  createHostelAllocation,
  deleteHostelAllocation,
  getAllocationSupportData,
  getChildHostelAllocation,
  getHostelAllocationById,
  getHostelAllocations,
  getMyHostelAllocation,
  getStudentHostelAllocations,
  leaveHostelAllocation,
  updateHostelAllocation,
} from "../controllers/hostelWorkflowController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireHostelManager } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.get("/my-hostel", allowRoles("student"), getMyHostelAllocation);
router.get("/child/:studentId", allowRoles("parent"), getChildHostelAllocation);
router.get("/support-data", requireHostelManager, getAllocationSupportData);

router.route("/").post(requireHostelManager, createHostelAllocation).get(requireHostelManager, getHostelAllocations);
router.get("/student/:studentId", requireHostelManager, getStudentHostelAllocations);
router.route("/:id").get(requireHostelManager, getHostelAllocationById).put(requireHostelManager, updateHostelAllocation).delete(allowRoles("admin", "superadmin"), deleteHostelAllocation);
router.patch("/:id/leave", requireHostelManager, leaveHostelAllocation);
router.patch("/:id/cancel", requireHostelManager, cancelHostelAllocation);

export default router;
