import { FiBookOpen, FiCalendar, FiCheckSquare, FiClock, FiCreditCard, FiEdit, FiFileText, FiHome, FiLayers, FiMap, FiPlusSquare, FiSettings, FiShield, FiTruck, FiUser, FiUsers, FiPackage } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import { canManageHostel, isHostelSecurityUser } from "../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../utils/transportAccess";
import {
  getAcademicGroupLabel,
  getParentLabelPlural,
  getSubjectLabelPlural,
  getTeacherLabelPlural,
} from "../utils/instituteLabels";

const roleLabels = {
  superadmin: "Super Admin",
  admin: "Institute Admin",
  teacher: "Teacher / Faculty",
  student: "Student",
  parent: "Parent / Guardian",
  staff: "Staff",
};

const adminMenuItems = [
  { label: "Dashboard", icon: FiHome, path: "/admin/dashboard" },
  { label: "Bulk Import", icon: FiPlusSquare, path: "/admin/bulk-import" },
  { label: "Academic Groups", icon: FiBookOpen, path: "/admin/academic-groups" },
  { label: "Teachers", icon: FiUser, path: "/admin/teachers" },
  { label: "Students", icon: FiUsers, path: "/admin/students" },
  { label: "Parents", icon: FiShield, path: "/admin/parents" },
  { label: "Staff", icon: FiLayers, path: "/admin/staff" },
  { label: "Subjects", icon: FiBookOpen, path: "/admin/subjects" },
  { label: "Attendance", icon: FiCheckSquare, path: "/admin/attendance" },
  { label: "Attendance Reports", icon: FiFileText, path: "/admin/attendance/reports" },
  { label: "Exams", icon: FiCalendar, path: "/admin/exams" },
  { label: "Marks", icon: FiEdit, path: "/admin/marks" },
  { label: "Results", icon: FiFileText, path: "/admin/results" },
  { label: "Notices", icon: FiFileText, path: "/admin/notices" },
  { label: "Fees", icon: FiCreditCard, path: "/admin/fees" },
  { label: "Timetable", icon: FiClock, path: "/admin/timetables" },
  { label: "Assignments", icon: FiEdit, path: "/admin/assignments" },
  { label: "Recycle Bin", icon: FiPackage, path: "/admin/recycle-bin" },
  { label: "Library Books", icon: FiBookOpen, path: "/admin/library/books" },
  { label: "Book Issues", icon: FiFileText, path: "/admin/library/issues" },
  { label: "Overdue Books", icon: FiCalendar, path: "/admin/library/issues/overdue" },
  { label: "Transport Vehicles", icon: FiTruck, path: "/admin/transport/vehicles" },
  { label: "Transport Routes", icon: FiMap, path: "/admin/transport/routes" },
  { label: "Transport Allocations", icon: FiUsers, path: "/admin/transport/allocations" },
  { label: "Hostels", icon: FiHome, path: "/admin/hostels" },
  { label: "Hostel Rooms", icon: FiLayers, path: "/admin/hostel-rooms" },
  { label: "Hostel Beds", icon: FiPackage, path: "/admin/hostel-beds" },
  { label: "Hostel Allocations", icon: FiUsers, path: "/admin/hostel-allocations" },
  { label: "Hostel Outpasses", icon: FiFileText, path: "/admin/hostel-outpasses" },
  { label: "Hostel Complaints", icon: FiShield, path: "/admin/hostel-complaints" },
];

const defaultMenuItems = [
  { label: "Dashboard", icon: FiHome, suffix: "dashboard" },
  { label: "Users", icon: FiUsers, suffix: "dashboard" },
  { label: "Academics", icon: FiBookOpen, suffix: "dashboard" },
  { label: "Settings", icon: FiLayers, suffix: "dashboard" },
];

const Sidebar = () => {
  const { user } = useAuth();
  const { settings, resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";
  const sidebarStyle = isDark
    ? { backgroundColor: settings.sidebarColor }
    : {
        background:
          "linear-gradient(180deg, #f8fbff 0%, #eef5ff 52%, #e6f0ff 100%)",
        borderRight: "1px solid rgba(203, 213, 225, 0.8)",
      };
  const canManageLibrary = user?.role === "admin" || (user?.role === "staff" && (user?.designation === "librarian" || (user?.permissions || []).includes("library.manage")));
  const canManageTransportModule = canManageTransport(user);
  const isDriver = isDriverUser(user);
  const canManageHostelModule = canManageHostel(user);
  const isHostelSecurity = isHostelSecurityUser(user);
  const basePath = user?.role === "superadmin" ? "/super-admin" : `/${user?.role}`;
  const superAdminItems = [
    { label: "Dashboard", icon: FiHome, path: "/super-admin/dashboard" },
    { label: "Institutes", icon: FiUsers, path: "/super-admin/institutes" },
    { label: "Create Institute", icon: FiPlusSquare, path: "/super-admin/institutes/create" },
    { label: "Global UI Settings", icon: FiSettings, path: "/super-admin/ui-settings" },
    { label: "Recycle Bin", icon: FiPackage, path: "/super-admin/recycle-bin" },
    { label: "Settings / Profile", icon: FiSettings, path: "/super-admin/settings" },
  ];

  const adminItemsForSuper = [];
  adminMenuItems.forEach((item) => {
    if (item.label === "Recycle Bin") {
      return;
    }
    let newItem = { ...item };
    if (newItem.label === "Academic Groups") {
      newItem.label = getAcademicGroupLabel(user);
    } else if (newItem.label === "Teachers") {
      newItem.label = getTeacherLabelPlural(user);
      adminItemsForSuper.push({ label: "Admins", icon: FiShield, path: "/super-admin/admins" });
    } else if (newItem.label === "Parents") {
      newItem.label = getParentLabelPlural(user);
    } else if (newItem.label === "Subjects") {
      newItem.label = getSubjectLabelPlural(user);
    }
    adminItemsForSuper.push(newItem);
  });

  const menuItems =
    user?.role === "superadmin"
      ? [
          ...superAdminItems,
          ...adminItemsForSuper,
        ]
      : user?.role === "admin"
        ? adminMenuItems.map((item) => {
            if (item.label === "Academic Groups") {
              return { ...item, label: getAcademicGroupLabel(user) };
            }
            if (item.label === "Teachers") {
              return { ...item, label: getTeacherLabelPlural(user) };
            }
            if (item.label === "Parents") {
              return { ...item, label: getParentLabelPlural(user) };
            }
            if (item.label === "Subjects") {
              return { ...item, label: getSubjectLabelPlural(user) };
            }
            return item;
          })
      : user?.role === "teacher"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/teacher/dashboard" },
            { label: "My Subjects", icon: FiBookOpen, path: "/teacher/subjects" },
            { label: "Mark Attendance", icon: FiCheckSquare, path: "/teacher/attendance/mark" },
            { label: "Attendance History", icon: FiFileText, path: "/teacher/attendance/history" },
            { label: "Exams", icon: FiCalendar, path: "/teacher/exams" },
            { label: "Upload Marks", icon: FiEdit, path: "/teacher/marks/upload" },
            { label: "Marks History", icon: FiFileText, path: "/teacher/marks/history" },
            { label: "Notices", icon: FiFileText, path: "/teacher/notices" },
            { label: "Timetable", icon: FiClock, path: "/teacher/timetable" },
            { label: "Assignments", icon: FiEdit, path: "/teacher/assignments" },
            { label: "Create Assignment", icon: FiPlusSquare, path: "/teacher/assignments/create" },
          ]
      : user?.role === "student"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/student/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/student/profile" },
            { label: "My Attendance", icon: FiCheckSquare, path: "/student/attendance" },
            { label: "My Exams", icon: FiCalendar, path: "/student/exams" },
            { label: "My Results", icon: FiFileText, path: "/student/results" },
            { label: "Notices", icon: FiFileText, path: "/student/notices" },
            { label: "Fees", icon: FiCreditCard, path: "/student/fees" },
            { label: "Timetable", icon: FiClock, path: "/student/timetable" },
            { label: "Assignments", icon: FiEdit, path: "/student/assignments" },
            { label: "Library", icon: FiBookOpen, path: "/student/library" },
            { label: "Transport", icon: FiTruck, path: "/student/transport" },
            { label: "My Hostel", icon: FiHome, path: "/student/hostel" },
            { label: "Hostel Outpass", icon: FiFileText, path: "/student/hostel/outpasses" },
            { label: "Hostel Complaints", icon: FiShield, path: "/student/hostel/complaints" },
          ]
      : user?.role === "parent"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/parent/dashboard" },
            { label: "Child Attendance", icon: FiCheckSquare, path: "/parent/attendance" },
            { label: "Child Exams", icon: FiCalendar, path: "/parent/exams" },
            { label: "Child Results", icon: FiFileText, path: "/parent/results" },
            { label: "Notices", icon: FiFileText, path: "/parent/notices" },
            { label: "Fees", icon: FiCreditCard, path: "/parent/fees" },
            { label: "Timetable", icon: FiClock, path: "/parent/timetable" },
            { label: "Assignments", icon: FiEdit, path: "/parent/assignments" },
            { label: "Child Library", icon: FiBookOpen, path: "/parent/library" },
            { label: "Child Transport", icon: FiTruck, path: "/parent/transport" },
            { label: "Child Hostel", icon: FiHome, path: "/parent/hostel" },
            { label: "Hostel Outpasses", icon: FiFileText, path: "/parent/hostel/outpasses" },
            { label: "Hostel Complaints", icon: FiShield, path: "/parent/hostel/complaints" },
          ]
      : user?.role === "staff"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/staff/dashboard" },
            { label: "Notices", icon: FiFileText, path: "/staff/notices" },
            ...(canManageLibrary
              ? [
                  { label: "Library Books", icon: FiBookOpen, path: "/staff/library/books" },
                  { label: "Book Issues", icon: FiFileText, path: "/staff/library/issues" },
                  { label: "Overdue Books", icon: FiCalendar, path: "/staff/library/issues/overdue" },
                ]
              : []),
            ...(canManageTransportModule
              ? [
                  { label: "Transport Vehicles", icon: FiTruck, path: "/staff/transport/vehicles" },
                  { label: "Transport Routes", icon: FiMap, path: "/staff/transport/routes" },
                  { label: "Transport Allocations", icon: FiUsers, path: "/staff/transport/allocations" },
                ]
              : []),
            ...(isDriver
              ? [
                  { label: "My Route", icon: FiTruck, path: "/staff/transport/my-route" },
                  { label: "My Students", icon: FiUsers, path: "/staff/transport/my-students" },
                ]
              : []),
            ...(canManageHostelModule
              ? [
                  { label: "Hostels", icon: FiHome, path: "/staff/hostels" },
                  { label: "Hostel Rooms", icon: FiLayers, path: "/staff/hostel-rooms" },
                  { label: "Hostel Beds", icon: FiPackage, path: "/staff/hostel-beds" },
                  { label: "Hostel Allocations", icon: FiUsers, path: "/staff/hostel-allocations" },
                  { label: "Hostel Outpasses", icon: FiFileText, path: "/staff/hostel-outpasses" },
                  { label: "Hostel Complaints", icon: FiShield, path: "/staff/hostel-complaints" },
                ]
              : []),
            ...(isHostelSecurity
              ? [
                  { label: "Hostels View", icon: FiHome, path: "/staff/hostels" },
                  { label: "Hostel Outpasses", icon: FiFileText, path: "/staff/hostel-outpasses" },
                  { label: "Hostel Complaints", icon: FiShield, path: "/staff/hostel-complaints" },
                ]
              : []),
          ]
        : defaultMenuItems.map((item) => ({ ...item, path: `${basePath}/${item.suffix}` }));

  return (
    <aside
      className={`flex w-full flex-col px-5 py-6 md:h-screen md:w-72 md:flex-shrink-0 md:overflow-hidden ${
        isDark ? "text-white" : "text-slate-900"
      }`}
      style={sidebarStyle}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`rounded-3xl p-5 shadow-card ${isDark ? "bg-white/10" : "bg-white/90 ring-1 ring-slate-200/80 backdrop-blur"}`}>
          <p className={`text-xs uppercase tracking-[0.35em] ${isDark ? "text-brand-100" : "text-slate-500"}`}>Control Center</p>
          <h2 className={`mt-3 text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{settings.appName}</h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{roleLabels[user?.role] || "ERP User"}</p>
        </div>

        <nav className="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto no-scrollbar pr-1">
          {menuItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "text-white"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-white hover:text-slate-950"
                }`
              }
              style={({ isActive }) => (isActive ? { backgroundColor: settings.primaryColor } : undefined)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
