import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiLogOut, FiSearch, FiSun, FiMoon } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import api from "../api/axios";

const Navbar = ({ onThemeToggle, themeReveal }) => {
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

  // Close dropdown on click outside, and reposition on scroll/resize
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        // Allow clicks inside the fixed dropdown portal (by checking the dropdown element)
        const dropdown = document.getElementById("navbar-search-dropdown");
        if (dropdown && dropdown.contains(e.target)) return;
        setShowDropdown(false);
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

  const searchItemsByRole = {
    superadmin: [
      { label: "Dashboard", path: "/super-admin/dashboard" },
      { label: "Admin Dashboard", path: "/admin/dashboard" },
      { label: "My Profile", path: "/super-admin/settings" },
      { label: "Institutes", path: "/super-admin/institutes" },
      { label: "Create Institute", path: "/super-admin/institutes/create" },
      { label: "Academic Groups", path: "/admin/academic-groups" },
      { label: "Global UI Settings", path: "/super-admin/ui-settings" },
      { label: "Audit Log Settings", path: "/super-admin/audit-log-settings" },
      { label: "Recycle Bin", path: "/super-admin/recycle-bin" },
      { label: "Admins", path: "/super-admin/admins" },
    ],
    admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "My Profile", path: "/admin/profile" },
      { label: "Bulk Import", path: "/admin/bulk-import" },
      { label: "Academic Groups", path: "/admin/academic-groups" },
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
      { label: "Recycle Bin", path: "/admin/recycle-bin" },
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
    ],
    teacher: [
      { label: "Dashboard", path: "/teacher/dashboard" },
      { label: "My Profile", path: "/teacher/profile" },
      { label: "My Subjects", path: "/teacher/subjects" },
      { label: "Mark Attendance", path: "/teacher/attendance/mark" },
      { label: "Attendance History", path: "/teacher/attendance/history" },
      { label: "Exams", path: "/teacher/exams" },
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
      { label: "Library", path: "/student/library" },
      { label: "Transport", path: "/student/transport" },
      { label: "My Hostel", path: "/student/hostel" },
      { label: "Hostel Outpass", path: "/student/hostel/outpasses" },
      { label: "Hostel Complaints", path: "/student/hostel/complaints" },
    ],
    parent: [
      { label: "Dashboard", path: "/parent/dashboard" },
      { label: "My Profile", path: "/parent/profile" },
      { label: "Child Attendance", path: "/parent/attendance" },
      { label: "Child Exams", path: "/parent/exams" },
      { label: "Child Results", path: "/parent/results" },
      { label: "Notices", path: "/parent/notices" },
      { label: "Fees", path: "/parent/fees" },
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
      { label: "Book Issues", path: "/staff/library/issues" },
      { label: "Overdue Books", path: "/staff/library/issues/overdue" },
      { label: "Transport Vehicles", path: "/staff/transport/vehicles" },
      { label: "Transport Routes", path: "/staff/transport/routes" },
      { label: "Transport Allocations", path: "/staff/transport/allocations" },
      { label: "Hostels", path: "/staff/hostels" },
      { label: "Hostel Rooms", path: "/staff/hostel-rooms" },
      { label: "Hostel Beds", path: "/staff/hostel-beds" },
      { label: "Hostel Allocations", path: "/staff/hostel-allocations" },
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
    <header className="relative z-[200] flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em]" style={{ color: settings.primaryColor }}>
          {settings.appName}
        </p>
        <h1 className="text-2xl font-semibold text-ink">Welcome back, {user?.name}</h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {user?.role === "superadmin" && institutes.length > 0 && (
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Managing:</span>
            <select
              value={activeInstId}
              onChange={handleInstituteChange}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none border-none cursor-pointer"
            >
              {institutes.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div ref={searchContainerRef} className="relative">
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

        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <FiBell />
          Notifications
        </button>

        <button
          ref={themeToggleRef}
          type="button"
          onClick={handleThemeToggleClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-90"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span
            className="flex items-center justify-center"
            style={
              themeReveal
                ? {
                    animation: `${themeReveal.direction === "expand" ? "login-theme-icon-bloom" : "login-theme-icon-dock"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }
                : undefined
            }
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
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
