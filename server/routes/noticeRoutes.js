import express from "express";
import {
  createNotice,
  deleteNotice,
  getMyNotices,
  getNoticeById,
  getNotices,
  updateNotice,
  updateNoticeStatus,
} from "../controllers/noticeController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-notices", allowRoles("teacher", "student", "parent", "staff"), getMyNotices);
router.get("/", allowRoles("admin"), getNotices);
router.get("/:id", allowRoles("admin"), getNoticeById);
router.post("/", allowRoles("admin"), createNotice);
router.put("/:id", allowRoles("admin"), updateNotice);
router.patch("/:id/status", allowRoles("admin"), updateNoticeStatus);
router.delete("/:id", allowRoles("admin"), deleteNotice);

export default router;
