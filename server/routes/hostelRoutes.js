import express from "express";
import {
  createBed,
  createHostel,
  createRoom,
  deleteHostel,
  deleteHostelBed,
  deleteHostelRoom,
  getHostelBedById,
  getHostelBeds,
  getHostelById,
  getHostelRoomById,
  getHostelRooms,
  getHostels,
  getSupportData,
  updateHostel,
  updateHostelBed,
  updateHostelBedStatus,
  updateHostelRoom,
  updateHostelRoomStatus,
  updateHostelStatus,
} from "../controllers/hostelController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireHostelManager, requireHostelViewer } from "../utils/hostelAccess.js";

const router = express.Router();

router.use(protect);

router.get("/support-data", requireHostelViewer, getSupportData);

router.route("/").post(requireHostelManager, createHostel).get(requireHostelViewer, getHostels);
router.patch("/:id/status", requireHostelManager, updateHostelStatus);
router.route("/:id").get(requireHostelViewer, getHostelById).put(requireHostelManager, updateHostel).delete(requireHostelManager, deleteHostel);

router.route("/:hostelId/rooms").post(requireHostelManager, createRoom).get(requireHostelViewer, getHostelRooms);
router.route("/:hostelId/rooms/:roomId/beds").post(requireHostelManager, createBed).get(requireHostelViewer, getHostelBeds);

export default router;
