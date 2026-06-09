import express from "express";
import {
  createBed,
  deleteHostelRoom,
  getHostelBeds,
  getHostelRoomById,
  getHostelRooms,
  updateHostelRoom,
  updateHostelRoomStatus,
} from "../controllers/hostelController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireHostelManager, requireHostelViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.get("/", requireHostelViewer, getHostelRooms);
router.route("/:id").get(requireHostelViewer, getHostelRoomById).put(requireHostelManager, updateHostelRoom).delete(requireHostelManager, deleteHostelRoom);
router.patch("/:id/status", requireHostelManager, updateHostelRoomStatus);
router.route("/:roomId/beds").post(requireHostelManager, createBed).get(requireHostelViewer, getHostelBeds);

export default router;
