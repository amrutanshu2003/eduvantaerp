import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiCheck, FiLogOut, FiMenu, FiMoon, FiSearch, FiSun, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import api from "../api/axios";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notifications";

const Navbar = ({ onThemeToggle, themeReveal, onSidebarToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, getButtonRadius, resolvedTheme, toggleTheme } = useUISettings();
  const themeToggleRef = useRef(null);
  const [institutes, setInstitutes] = useState([]);
  const [activeInstId, setActiveInstId] = useState(
    localStorage.getItem("activeInstituteId") || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationRef = useRef(null);
  const [notificationDropdownStyle, setNotificationDropdownStyle] = useState({});

  // Close dropdown on click outside, and reposition on scroll/resize
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        // Allow clicks inside the fixed dropdown portal (by checking the dropdown element)
        const dropdown = document.getElementById("navbar-search-dropdown");
        if (dropdown && dropdown.contains(e.target)) return;
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        const notificationDropdown = document.getElementById("navbar-notification-dropdown");
        if (notificationDropdown && notificationDropdown.contains(e.target)) return;
        setShowNotificationDropdown(false);
      }
    };
    const handleScrollOrResize = () => {
      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
          zIndex: 99999,
        });
      }
      if (notificationRef.current) {
        const rect = notificationRef.current.getBoundingClientRect();
        setNotificationDropdownStyle({
          position: "fixed",
          top: rect.bottom + 8,
          left: rect.left,
          width: 320,
          zIndex: 99999,
        });
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  // Inject global style once to hide webkit scrollbar on portal dropdown
  useEffect(() => {
    const styleId = "navbar-search-dropdown-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = "#navbar-search-dropdown::-webkit-scrollbar { display: none; }";
      document.head.appendChild(style);
    }
  }, []);

  // Fetch notifications and unread count
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications({ limit: 10 });
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
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

    fetchNotifications();
    fetchUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Update notification dropdown position
  const updateNotificationDropdownPosition = () => {
    if (notificationRef.current) {
      const rect = notificationRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const dropdownHeight = 400; // Approximate max height
      const rightSpace = window.innerWidth - rect.left;
      const bottomSpace = window.innerHeight - rect.bottom;
      
      // If there's not enough space on the right, align to the right edge
      const left = rightSpace < dropdownWidth ? rect.right - dropdownWidth : rect.left;
      
      // If there's not enough space at the bottom, position above the button
      const top = bottomSpace < dropdownHeight ? rect.top - dropdownHeight - 8 : rect.bottom + 8;
      
      setNotificationDropdownStyle({
        position: "fixed",
        top,
        left,
        width: dropdownWidth,
        zIndex: 2147483647,
      });
    }
  };

  const handleNotificationClick = () => {
    updateNotificationDropdownPosition();
    setShowNotificationDropdown((prev) => !prev);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
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

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
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

  const handleNotificationClickItem = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id, { stopPropagation: () => {} });
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotificationDropdown(false);
  };

  const searchItemsByRole = {
    superadmin: [
      { label: "Dashboard", path: "/super-admin/dashboard" },
      { label: "Admin Dashboard", path: "/admin/dashboard" },
      { label: "My Profile", path: "/super-admin/profile" },
      { label: "Global Settings", path: "/super-admin/settings" },
      { label: "Institutes", path: "/super-admin/institutes" },
      { label: "Create Institute", path: "/super-admin/institutes/create" },
      { label: "Create Institute Admin", path: "/super-admin/institutes/create" },
      { label: "Admins", path: "/super-admin/admins" },
      { label: "Create Admin", path: "/super-admin/admins/create" },
      { label: "Academic Groups", path: "/admin/academic-groups" },
      { label: "Create Academic Group", path: "/admin/academic-groups/create" },
      { label: "Teachers", path: "/admin/teachers" },
      { label: "Students", path: "/admin/students" },
      { label: "Parents", path: "/admin/parents" },
      { label: "Staff", path: "/admin/staff" },
      { label: "Subjects", path: "/admin/subjects" },
      { label: "Attendance", path: "/admin/attendance" },
      { label: "Attendance Reports", path: "/admin/attendance/reports" },
      { label: "Exams", path: "/admin/exams" },
      { label: "Marks", path: "/admin/marks" },
      { label: "Results", path: "/admin/results" },
      { label: "Notices", path: "/admin/notices" },
      { label: "Fees", path: "/admin/fees" },
      { label: "Timetable", path: "/admin/timetables" },
      { label: "Assignments", path: "/admin/assignments" },
      { label: "Library Books", path: "/admin/library/books" },
      { label: "Book Issues", path: "/admin/library/issues" },
      { label: "Overdue Books", path: "/admin/library/issues/overdue" },
      { label: "Transport Vehicles", path: "/admin/transport/vehicles" },
      { label: "Transport Routes", path: "/admin/transport/routes" },
      { label: "Transport Allocations", path: "/admin/transport/allocations" },
      { label: "Hostels", path: "/admin/hostels" },
      { label: "Hostel Rooms", path: "/admin/hostel-rooms" },
      { label: "Hostel Beds", path: "/admin/hostel-beds" },
      { label: "Hostel Allocations", path: "/admin/hostel-allocations" },
      { label: "Hostel Outpasses", path: "/admin/hostel-outpasses" },
      { label: "Hostel Complaints", path: "/admin/hostel-complaints" },
      { label: "Global UI Settings", path: "/super-admin/ui-settings" },
      { label: "Audit Log Settings", path: "/super-admin/audit-log-settings" },
      { label: "Recycle Bin", path: "/super-admin/recycle-bin" },
      { label: "Bulk Import", path: "/admin/bulk-import" },
    ],
    admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "My Profile", path: "/admin/profile" },
      { label: "Bulk Import", path: "/admin/bulk-import" },
      { label: "Academic Groups", path: "/admin/academic-groups" },
      { label: "Create Academic Group", path: "/admin/academic-groups/create" },
      { label: "Teachers", path: "/admin/teachers" },
      { label: "Create Teacher", path: "/admin/teachers/create" },
      { label: "Students", path: "/admin/students" },
      { label: "Create Student", path: "/admin/students/create" },
      { label: "Parents", path: "/admin/parents" },
      { label: "Create Parent", path: "/admin/parents/create" },
      { label: "Staff", path: "/admin/staff" },
      { label: "Create Staff", path: "/admin/staff/create" },
      { label: "Subjects", path: "/admin/subjects" },
      { label: "Create Subject", path: "/admin/subjects/create" },
      { label: "Attendance", path: "/admin/attendance" },
      { label: "Attendance Reports", path: "/admin/attendance/reports" },
      { label: "Exams", path: "/admin/exams" },
      { label: "Create Exam", path: "/admin/exams/create" },
      { label: "Marks", path: "/admin/marks" },
      { label: "Results", path: "/admin/results" },
      { label: "Notices", path: "/admin/notices" },
      { label: "Create Notice", path: "/admin/notices/create" },
      { label: "Fees", path: "/admin/fees" },
      { label: "Create Fee", path: "/admin/fees/create" },
      { label: "Timetable", path: "/admin/timetables" },
      { label: "Create Timetable", path: "/admin/timetables/create" },
      { label: "Assignments", path: "/admin/assignments" },
      { label: "Recycle Bin", path: "/admin/recycle-bin" },
      { label: "Library Books", path: "/admin/library/books" },
      { label: "Add Library Book", path: "/admin/library/books/create" },
      { label: "Book Issues", path: "/admin/library/issues" },
      { label: "Issue Book", path: "/admin/library/issues/create" },
      { label: "Overdue Books", path: "/admin/library/issues/overdue" },
      { label: "Transport Vehicles", path: "/admin/transport/vehicles" },
      { label: "Add Vehicle", path: "/admin/transport/vehicles/create" },
      { label: "Transport Routes", path: "/admin/transport/routes" },
      { label: "Create Route", path: "/admin/transport/routes/create" },
      { label: "Transport Allocations", path: "/admin/transport/allocations" },
      { label: "Create Transport Allocation", path: "/admin/transport/allocations/create" },
      { label: "Hostels", path: "/admin/hostels" },
      { label: "Create Hostel", path: "/admin/hostels/create" },
      { label: "Hostel Rooms", path: "/admin/hostel-rooms" },
      { label: "Create Hostel Room", path: "/admin/hostel-rooms/create" },
      { label: "Hostel Beds", path: "/admin/hostel-beds" },
      { label: "Create Hostel Bed", path: "/admin/hostel-beds/create" },
      { label: "Hostel Allocations", path: "/admin/hostel-allocations" },
      { label: "Create Hostel Allocation", path: "/admin/hostel-allocations/create" },
      { label: "Hostel Outpasses", path: "/admin/hostel-outpasses" },
      { label: "Hostel Complaints", path: "/admin/hostel-complaints" },
    ],
    teacher: [
      { label: "Dashboard", path: "/teacher/dashboard" },
      { label: "My Profile", path: "/teacher/profile" },
      { label: "My Subjects", path: "/teacher/subjects" },
      { label: "Attendance", path: "/teacher/attendance" },
      { label: "Mark Attendance", path: "/teacher/attendance/mark" },
      { label: "Attendance History", path: "/teacher/attendance/history" },
      { label: "Exams", path: "/teacher/exams" },
      { label: "Marks", path: "/teacher/marks" },
      { label: "Upload Marks", path: "/teacher/marks/upload" },
      { label: "Marks History", path: "/teacher/marks/history" },
      { label: "Notices", path: "/teacher/notices" },
      { label: "Timetable", path: "/teacher/timetable" },
      { label: "Assignments", path: "/teacher/assignments" },
      { label: "Create Assignment", path: "/teacher/assignments/create" },
    ],
    student: [
      { label: "Dashboard", path: "/student/dashboard" },
      { label: "My Profile", path: "/student/profile" },
      { label: "My Attendance", path: "/student/attendance" },
      { label: "My Exams", path: "/student/exams" },
      { label: "My Results", path: "/student/results" },
      { label: "Notices", path: "/student/notices" },
      { label: "Fees", path: "/student/fees" },
      { label: "Timetable", path: "/student/timetable" },
      { label: "Assignments", path: "/student/assignments" },
      { label: "Submit Assignment", path: "/student/assignments" },
      { label: "Library", path: "/student/library" },
      { label: "Transport", path: "/student/transport" },
      { label: "My Hostel", path: "/student/hostel" },
      { label: "Hostel Outpass", path: "/student/hostel/outpasses" },
      { label: "Request Outpass", path: "/student/hostel/outpasses/create" },
      { label: "Hostel Complaints", path: "/student/hostel/complaints" },
      { label: "File Complaint", path: "/student/hostel/complaints/create" },
    ],
    parent: [
      { label: "Dashboard", path: "/parent/dashboard" },
      { label: "My Profile", path: "/parent/profile" },
      { label: "Child Attendance", path: "/parent/attendance" },
      { label: "Child Exams", path: "/parent/exams" },
      { label: "Child Results", path: "/parent/results" },
      { label: "Notices", path: "/parent/notices" },
      { label: "Fees", path: "/parent/fees" },
      { label: "Child Fees", path: "/parent/fees" },
      { label: "Timetable", path: "/parent/timetable" },
      { label: "Assignments", path: "/parent/assignments" },
      { label: "Child Library", path: "/parent/library" },
      { label: "Child Transport", path: "/parent/transport" },
      { label: "Child Hostel", path: "/parent/hostel" },
      { label: "Hostel Outpasses", path: "/parent/hostel/outpasses" },
      { label: "Hostel Complaints", path: "/parent/hostel/complaints" },
    ],
    staff: [
      { label: "Dashboard", path: "/staff/dashboard" },
      { label: "My Profile", path: "/staff/profile" },
      { label: "Notices", path: "/staff/notices" },
      { label: "Library Books", path: "/staff/library/books" },
      { label: "Add Library Book", path: "/staff/library/books/create" },
      { label: "Book Issues", path: "/staff/library/issues" },
      { label: "Issue Book", path: "/staff/library/issues/create" },
      { label: "Overdue Books", path: "/staff/library/issues/overdue" },
      { label: "Transport Vehicles", path: "/staff/transport/vehicles" },
      { label: "Add Vehicle", path: "/staff/transport/vehicles/create" },
      { label: "Transport Routes", path: "/staff/transport/routes" },
      { label: "Create Route", path: "/staff/transport/routes/create" },
      { label: "Transport Allocations", path: "/staff/transport/allocations" },
      { label: "Create Transport Allocation", path: "/staff/transport/allocations/create" },
      { label: "My Driver Route", path: "/staff/transport/my-route" },
      { label: "My Students (Driver)", path: "/staff/transport/my-students" },
      { label: "Hostels", path: "/staff/hostels" },
      { label: "Create Hostel", path: "/staff/hostels/create" },
      { label: "Hostel Rooms", path: "/staff/hostel-rooms" },
      { label: "Create Hostel Room", path: "/staff/hostel-rooms/create" },
      { label: "Hostel Beds", path: "/staff/hostel-beds" },
      { label: "Create Hostel Bed", path: "/staff/hostel-beds/create" },
      { label: "Hostel Allocations", path: "/staff/hostel-allocations" },
      { label: "Create Hostel Allocation", path: "/staff/hostel-allocations/create" },
      { label: "Hostel Outpasses", path: "/staff/hostel-outpasses" },
      { label: "Hostel Complaints", path: "/staff/hostel-complaints" },
    ],
  };

  const itemsToSearch = searchItemsByRole[user?.role] || [];
  const filteredItems = searchQuery
    ? itemsToSearch.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : itemsToSearch;

  const updateDropdownPosition = () => {
    if (searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    updateDropdownPosition();
    setShowDropdown(true);
  };

  const handleSearchSelect = (path) => {
    setSearchQuery("");
    setShowDropdown(false);
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredItems.length > 0) {
      handleSearchSelect(filteredItems[0].path);
    }
  };

  useEffect(() => {
    if (user?.role !== "superadmin") return;

    const fetchInstitutes = async () => {
      try {
        const { data } = await api.get("/institutes");
        const activeList = data.institutes.filter((inst) => inst.status === "active");
        setInstitutes(activeList);
        
        // If nothing is selected, default to the first active institute
        if (!localStorage.getItem("activeInstituteId") && activeList.length > 0) {
          localStorage.setItem("activeInstituteId", activeList[0]._id);
          setActiveInstId(activeList[0]._id);
        }
      } catch {
        // silently ignore — navbar institute list is non-critical
      }
    };

    fetchInstitutes();
  }, [user]);

  const handleInstituteChange = (event) => {
    const nextId = event.target.value;
    localStorage.setItem("activeInstituteId", nextId);
    setActiveInstId(nextId);
    window.location.reload(); // Reload to refresh all active panels/states with new scope
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isDark = resolvedTheme === "dark";
  const handleThemeToggleClick = () => {
    if (onThemeToggle) {
      onThemeToggle(themeToggleRef.current);
      return;
    }

    toggleTheme();
  };

  return (
    <header className="relative z-[200] flex h-16 md:h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-3 md:px-4 lg:px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={onSidebarToggle}
          className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl md:rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open sidebar"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] truncate" style={{ color: settings.primaryColor }}>
          {settings.appName}
        </p>
        <h1 className="hidden sm:block text-sm md:text-lg font-bold text-ink truncate mt-0.5">Welcome, {user?.name}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {user?.role === "superadmin" && institutes.length > 0 && (
          <label className="flex items-center gap-1.5 md:gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 md:px-3 py-1.5 text-slate-500 flex-shrink-0">
            <span className="hidden lg:inline text-xs font-semibold uppercase tracking-wider text-slate-400">Managing:</span>
            <select
              value={activeInstId}
              onChange={handleInstituteChange}
              className="bg-transparent text-xs md:text-sm font-semibold text-slate-700 outline-none border-none cursor-pointer max-w-[80px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-[200px] truncate"
            >
              {institutes.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div ref={searchContainerRef} className="hidden md:block relative">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500 transition-all focus-within:border-slate-400 focus-within:bg-white shadow-sm">
            <FiSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                updateDropdownPosition();
                setShowDropdown(true);
              }}
              placeholder="Search modules..."
              className="w-full bg-transparent text-sm outline-none md:w-56"
            />
          </label>
        </div>

        {/* Dropdown rendered via Portal directly on body - escapes ALL stacking contexts from transforms/animations */}
        {showDropdown && createPortal(
          <div
            id="navbar-search-dropdown"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: dropdownStyle.top ?? 0,
              left: dropdownStyle.left ?? 0,
              width: dropdownStyle.width ?? 300,
              zIndex: 2147483647,
              backgroundColor: isDark ? "#111c2d" : "rgba(255,255,255,0.97)",
              border: `1px solid ${isDark ? "#223147" : "#e2e8f0"}`,
              borderRadius: "1rem",
              padding: "0.5rem",
              boxShadow: isDark
                ? "0 24px 70px rgba(2,6,23,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
                : "0 20px 60px rgba(15,23,42,0.13)",
              backdropFilter: "blur(16px)",
              maxHeight: "18rem",
              overflowY: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {filteredItems.length === 0 ? (
              <div style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: isDark ? "#7487a3" : "#94a3b8" }}>
                No matching modules found
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSearchSelect(item.path)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: "0.5rem",
                    borderRadius: "0.75rem",
                    padding: "0.625rem 1rem",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    color: isDark ? "#cad7ea" : "#334155",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9";
                    e.currentTarget.style.color = isDark ? "#e5eefb" : "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = isDark ? "#cad7ea" : "#334155";
                  }}
                >
                  <FiSearch style={{ width: "0.875rem", height: "0.875rem", color: isDark ? "#7487a3" : "#94a3b8", flexShrink: 0 }} />
                  {item.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-90 flex-shrink-0 relative"
            title="Notifications"
          >
            <FiBell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-xs font-bold text-white"
                style={{
                  fontSize: unreadCount > 99 ? "0.625rem" : unreadCount > 9 ? "0.6875rem" : "0.75rem",
                  minWidth: unreadCount > 99 ? "1rem" : "1rem",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification dropdown rendered via Portal */}
        {showNotificationDropdown && createPortal(
          <div
            id="navbar-notification-dropdown"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: notificationDropdownStyle.top ?? 0,
              left: notificationDropdownStyle.left ?? 0,
              width: notificationDropdownStyle.width ?? 320,
              zIndex: 2147483647,
              backgroundColor: isDark ? "#111c2d" : "rgba(255,255,255,0.97)",
              border: `1px solid ${isDark ? "#223147" : "#e2e8f0"}`,
              borderRadius: "1rem",
              padding: "0.5rem",
              boxShadow: isDark
                ? "0 24px 70px rgba(2,6,23,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
                : "0 20px 60px rgba(15,23,42,0.13)",
              backdropFilter: "blur(16px)",
              maxHeight: "24rem",
              overflowY: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${isDark ? "#223147" : "#e2e8f0"}`, marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: isDark ? "#cad7ea" : "#334155" }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{ fontSize: "0.75rem", color: isDark ? "#7487a3" : "#64748b", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: "0.375rem" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: isDark ? "#7487a3" : "#94a3b8" }}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClickItem(notification)}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    background: notification.isRead ? "transparent" : isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.05)",
                    border: notification.isRead ? "none" : `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)"}`,
                    marginBottom: "0.25rem",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.isRead ? "transparent" : isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.05)";
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: isDark ? "#cad7ea" : "#334155", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: isDark ? "#7487a3" : "#64748b", marginBottom: "0.25rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: isDark ? "#5a6b85" : "#94a3b8" }}>
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        style={{ padding: "0.25rem", background: "transparent", border: "none", cursor: "pointer", color: isDark ? "#7487a3" : "#64748b", borderRadius: "0.25rem" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        title="Mark as read"
                      >
                        <FiCheck style={{ width: "0.875rem", height: "0.875rem" }} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      style={{ padding: "0.25rem", background: "transparent", border: "none", cursor: "pointer", color: isDark ? "#7487a3" : "#64748b", borderRadius: "0.25rem" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      title="Delete"
                    >
                      <FiTrash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>,
          document.body
        )}

        <button
          ref={themeToggleRef}
          type="button"
          onClick={handleThemeToggleClick}
          disabled={Boolean(themeReveal)}
          className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span
            className={`theme-toggle-icon-spin flex items-center justify-center ${themeReveal ? "theme-toggle-animating" : ""}`}
          >
            {isDark ? (
              <FiSun className="h-4 w-4 text-amber-500" />
            ) : (
              <FiMoon className="h-4 w-4 text-slate-600" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          className="flex h-8 w-8 md:h-9 md:w-auto items-center justify-center gap-2 md:px-4 text-sm font-medium text-white transition hover:opacity-90 flex-shrink-0"
        >
          <FiLogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
