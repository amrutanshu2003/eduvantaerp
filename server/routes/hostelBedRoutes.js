import express from "express";
import {
  deleteHostelBed,
  getHostelBedById,
  getHostelBeds,
  updateHostelBed,
  updateHostelBedStatus,
} from "../controllers/hostelController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireHostelManager, requireHostelViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.get("/", requireHostelViewer, getHostelBeds);
router.route("/:id").get(requireHostelViewer, getHostelBedById).put(requireHostelManager, updateHostelBed).delete(requireHostelManager, deleteHostelBed);
router.patch("/:id/status", requireHostelManager, updateHostelBedStatus);

export default router;
