import Notification from "../models/Notification.js";
import createAuditLog from "../utils/audit.js";
import { getScopedInstituteId } from "../utils/scope.js";

const sanitizeNotification = (notification) => {
  const { __v, ...sanitized } = notification.toObject();
  return sanitized;
};

const getNotifications = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Build query based on access rules
    const query = {
      isDeleted: false,
      $or: [
        { recipientUserId: userId },
        { recipientRole: userRole, instituteId },
        { recipientRole: userRole, instituteId: null },
      ],
    };

    // Filter by unread status
    if (req.query.unreadOnly === "true") {
      query.isRead = false;
    }

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications: notifications.map(sanitizeNotification),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const userId = req.user._id;
    const userRole = req.user.role;

    const query = {
      isDeleted: false,
      isRead: false,
      $or: [
        { recipientUserId: userId },
        { recipientRole: userRole, instituteId },
        { recipientRole: userRole, instituteId: null },
      ],
    };

    const count = await Notification.countDocuments(query);

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    // Check if user has access to this notification
    const userId = req.user._id;
    const userRole = req.user.role;
    const instituteId = getScopedInstituteId(req, false);

    const hasAccess =
      String(notification.recipientUserId) === String(userId) ||
      (notification.recipientRole === userRole &&
        (String(notification.instituteId) === String(instituteId) || notification.instituteId === null));

    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied to this notification");
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: "Notification marked as read", notification: sanitizeNotification(notification) });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const userId = req.user._id;
    const userRole = req.user.role;

    const query = {
      isDeleted: false,
      isRead: false,
      $or: [
        { recipientUserId: userId },
        { recipientRole: userRole, instituteId },
        { recipientRole: userRole, instituteId: null },
      ],
    };

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });

    res.json({ message: "All notifications marked as read", count: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    // Check if user has access to this notification
    const userId = req.user._id;
    const userRole = req.user.role;
    const instituteId = getScopedInstituteId(req, false);

    const hasAccess =
      String(notification.recipientUserId) === String(userId) ||
      (notification.recipientRole === userRole &&
        (String(notification.instituteId) === String(instituteId) || notification.instituteId === null));

    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied to this notification");
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);

    // Only admin and superadmin can manually create notifications
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      res.status(403);
      throw new Error("Only admin and superadmin can create notifications");
    }

    const { recipientUserId, recipientRole, title, message, type, link, priority, metadata } = req.body;

    if (!title?.trim() || !message?.trim()) {
      res.status(400);
      throw new Error("Title and message are required");
    }

    if (!recipientUserId && !recipientRole) {
      res.status(400);
      throw new Error("Either recipientUserId or recipientRole is required");
    }

    const notification = await Notification.create({
      instituteId: req.user.role === "superadmin" && !instituteId ? null : instituteId,
      recipientUserId: recipientUserId || null,
      recipientRole: recipientRole || null,
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      link: link?.trim() || null,
      priority: priority || "normal",
      createdBy: req.user._id,
      metadata: metadata || null,
    });

    await createAuditLog({
      req,
      instituteId: notification.instituteId,
      action: "create",
      entity: "notification",
      entityId: notification._id,
      message: "Notification created manually",
    });

    res.status(201).json({ message: "Notification created successfully", notification: sanitizeNotification(notification) });
  } catch (error) {
    next(error);
  }
};

export {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
};
