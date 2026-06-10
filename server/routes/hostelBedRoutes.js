import express from "express";
import {
  deleteHostelBed,
  getHostelBedById,
  getHostelBeds,
  updateHostelBed,
  updateHostelBedStatus,
} from "../controllers/hostelController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireHostelManager, requireHostelViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.get("/", requireHostelViewer, getHostelBeds);
router.route("/:id").get(requireHostelViewer, getHostelBedById).put(requireHostelManager, updateHostelBed).delete(allowRoles("admin", "superadmin"), deleteHostelBed);
router.patch("/:id/status", requireHostelManager, updateHostelBedStatus);

export default router;
