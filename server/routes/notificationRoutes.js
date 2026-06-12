import express from "express";
import {
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/:id/read", markNotificationRead);
router.patch("/mark-all-read", markAllNotificationsRead);
router.delete("/:id", deleteNotification);
router.post("/", createNotification);

export default router;
