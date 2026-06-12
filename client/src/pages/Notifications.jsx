import { useEffect, useState } from "react";
import { FiCheck, FiTrash2, FiFilter } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notifications";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, resolvedTheme } = useUISettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [loading, setLoading] = useState(true);

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (filterType !== "all") params.type = filterType;
      if (filterRead === "unread") params.isRead = false;
      if (filterRead === "read") params.isRead = true;

      const data = await getNotifications(params);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (notifications.find((n) => n._id === notificationId)?.isRead === false) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (filterRead === "unread" && n.isRead) return false;
    if (filterRead === "read" && !n.isRead) return false;
    return true;
  });

  const notificationTypes = ["all", "notice", "fee", "attendance", "assignment", "exam", "hostel", "transport", "library"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {notificationTypes.map((type) => (
              <option key={type} value={type} className="capitalize">
                {type === "all" ? "All Types" : type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div className="flex-1" />

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
          >
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                notification.isRead
                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  : "bg-blue-50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-800"
              } hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                    <span className="capitalize">{notification.type}</span>
                    <span>•</span>
                    <span>
                      {new Date(notification.createdAt).toLocaleDateString()}{" "}
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-500 transition"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
