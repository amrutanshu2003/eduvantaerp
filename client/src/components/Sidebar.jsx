import { FiBookOpen, FiCalendar, FiCheckSquare, FiClock, FiCreditCard, FiEdit, FiFileText, FiHome, FiLayers, FiMap, FiPlusSquare, FiSettings, FiShield, FiTrash2, FiTruck, FiUser, FiUsers, FiPackage } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import { useLabelSettings } from "../context/LabelSettingsContext";
import { canManageHostel, isHostelSecurityUser } from "../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../utils/transportAccess";

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
  { label: "My Profile", icon: FiUser, path: "/admin/profile" },
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
  const { settings, resolvedTheme, getButtonRadius } = useUISettings();
  const { getLabel, isModuleEnabled } = useLabelSettings();
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

  // Helper functions to get plural labels
  const getAcademicGroupLabel = () => {
    const label = getLabel("academicGroupLabel");
    return label + (label.endsWith("s") ? "" : "s");
  };

  const getTeacherLabelPlural = () => {
    const label = getLabel("teacherLabel");
    return label + (label.endsWith("s") ? "" : "s");
  };

  const getParentLabelPlural = () => {
    const label = getLabel("parentLabel");
    return label + (label.endsWith("s") ? "" : "s");
  };

  const getSubjectLabelPlural = () => {
    const label = getLabel("subjectLabel");
    return label + (label.endsWith("s") ? "" : "s");
  };

  const superAdminItems = [
    { label: "Dashboard", icon: FiHome, path: "/super-admin/dashboard" },
    { label: "Admin Dashboard", icon: FiHome, path: "/admin/dashboard" },
    { label: "My Profile", icon: FiUser, path: "/super-admin/settings" },
    { label: "Institutes", icon: FiUsers, path: "/super-admin/institutes" },
    { label: "Create Institute", icon: FiPlusSquare, path: "/super-admin/institutes/create" },
    { label: "Global Settings", icon: FiSettings, path: "/super-admin/settings" },
    { label: "Global UI Settings", icon: FiSettings, path: "/super-admin/ui-settings" },
    { label: "Audit Log Settings", icon: FiTrash2, path: "/super-admin/audit-log-settings" },
    { label: "Recycle Bin", icon: FiPackage, path: "/super-admin/recycle-bin" },
  ];

  const adminItemsForSuper = [];
  adminMenuItems.forEach((item) => {
    if (
      item.label === "Recycle Bin" ||
      item.label === "My Profile" ||
      item.label === "Dashboard"
    ) {
      return;
    }
    let newItem = { ...item };
    if (newItem.label === "Academic Groups") {
      newItem.label = getAcademicGroupLabel();
    } else if (newItem.label === "Teachers") {
      newItem.label = getTeacherLabelPlural();
      adminItemsForSuper.push({ label: "Admins", icon: FiShield, path: "/super-admin/admins" });
    } else if (newItem.label === "Parents") {
      newItem.label = getParentLabelPlural();
    } else if (newItem.label === "Subjects") {
      newItem.label = getSubjectLabelPlural();
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
        ? [
            { label: "Dashboard", icon: FiHome, path: "/admin/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/admin/profile" },
            { label: "Institute Settings", icon: FiSettings, path: "/admin/settings" },
            { label: "Bulk Import", icon: FiPlusSquare, path: "/admin/bulk-import" },
            { label: getAcademicGroupLabel(), icon: FiBookOpen, path: "/admin/academic-groups" },
            ...(isModuleEnabled("teachers") ? [{ label: getTeacherLabelPlural(), icon: FiUser, path: "/admin/teachers" }] : []),
            ...(isModuleEnabled("students") ? [{ label: getLabel("studentLabel") + "s", icon: FiUsers, path: "/admin/students" }] : []),
            ...(isModuleEnabled("parents") ? [{ label: getParentLabelPlural(), icon: FiShield, path: "/admin/parents" }] : []),
            ...(isModuleEnabled("staff") ? [{ label: getLabel("staffLabel") + "s", icon: FiLayers, path: "/admin/staff" }] : []),
            ...(isModuleEnabled("subjects") ? [{ label: getSubjectLabelPlural(), icon: FiBookOpen, path: "/admin/subjects" }] : []),
            ...(isModuleEnabled("attendance") ? [
              { label: getLabel("attendanceLabel"), icon: FiCheckSquare, path: "/admin/attendance" },
              { label: "Attendance Reports", icon: FiFileText, path: "/admin/attendance/reports" },
            ] : []),
            ...(isModuleEnabled("exams") ? [{ label: getLabel("examLabel") + "s", icon: FiCalendar, path: "/admin/exams" }] : []),
            ...(isModuleEnabled("marks") ? [
              { label: getLabel("marksLabel"), icon: FiEdit, path: "/admin/marks" },
              { label: getLabel("resultLabel") + "s", icon: FiFileText, path: "/admin/results" },
            ] : []),
            ...(isModuleEnabled("notices") ? [{ label: getLabel("noticeLabel") + "s", icon: FiFileText, path: "/admin/notices" }] : []),
            ...(isModuleEnabled("fees") ? [{ label: getLabel("feeLabel") + "s", icon: FiCreditCard, path: "/admin/fees" }] : []),
            ...(isModuleEnabled("timetable") ? [{ label: getLabel("timetableLabel"), icon: FiClock, path: "/admin/timetables" }] : []),
            ...(isModuleEnabled("assignments") ? [{ label: getLabel("assignmentLabel") + "s", icon: FiEdit, path: "/admin/assignments" }] : []),
            { label: "Recycle Bin", icon: FiPackage, path: "/admin/recycle-bin" },
            ...(isModuleEnabled("library") ? [
              { label: getLabel("libraryLabel") + " Books", icon: FiBookOpen, path: "/admin/library/books" },
              { label: "Book Issues", icon: FiFileText, path: "/admin/library/issues" },
              { label: "Overdue Books", icon: FiCalendar, path: "/admin/library/issues/overdue" },
            ] : []),
            ...(isModuleEnabled("transport") ? [
              { label: getLabel("transportLabel") + " Vehicles", icon: FiTruck, path: "/admin/transport/vehicles" },
              { label: getLabel("transportLabel") + " Routes", icon: FiMap, path: "/admin/transport/routes" },
              { label: getLabel("transportLabel") + " Allocations", icon: FiUsers, path: "/admin/transport/allocations" },
            ] : []),
            ...(isModuleEnabled("hostel") ? [
              { label: getLabel("hostelLabel") + "s", icon: FiHome, path: "/admin/hostels" },
              { label: getLabel("hostelLabel") + " Rooms", icon: FiLayers, path: "/admin/hostel-rooms" },
              { label: getLabel("hostelLabel") + " Beds", icon: FiPackage, path: "/admin/hostel-beds" },
              { label: getLabel("hostelLabel") + " Allocations", icon: FiUsers, path: "/admin/hostel-allocations" },
              { label: getLabel("hostelLabel") + " Outpasses", icon: FiFileText, path: "/admin/hostel-outpasses" },
              { label: getLabel("hostelLabel") + " Complaints", icon: FiShield, path: "/admin/hostel-complaints" },
            ] : []),
          ]
      : user?.role === "teacher"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/teacher/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/teacher/profile" },
            ...(isModuleEnabled("subjects") ? [{ label: "My Subjects", icon: FiBookOpen, path: "/teacher/subjects" }] : []),
            ...(isModuleEnabled("attendance") ? [
              { label: "Mark Attendance", icon: FiCheckSquare, path: "/teacher/attendance/mark" },
              { label: "Attendance History", icon: FiFileText, path: "/teacher/attendance/history" },
            ] : []),
            ...(isModuleEnabled("exams") ? [{ label: getLabel("examLabel") + "s", icon: FiCalendar, path: "/teacher/exams" }] : []),
            ...(isModuleEnabled("marks") ? [
              { label: "Upload Marks", icon: FiEdit, path: "/teacher/marks/upload" },
              { label: "Marks History", icon: FiFileText, path: "/teacher/marks/history" },
            ] : []),
            ...(isModuleEnabled("notices") ? [{ label: getLabel("noticeLabel") + "s", icon: FiFileText, path: "/teacher/notices" }] : []),
            ...(isModuleEnabled("timetable") ? [{ label: getLabel("timetableLabel"), icon: FiClock, path: "/teacher/timetable" }] : []),
            ...(isModuleEnabled("assignments") ? [
              { label: getLabel("assignmentLabel") + "s", icon: FiEdit, path: "/teacher/assignments" },
              { label: "Create Assignment", icon: FiPlusSquare, path: "/teacher/assignments/create" },
            ] : []),
          ]
      : user?.role === "student"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/student/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/student/profile" },
            ...(isModuleEnabled("attendance") ? [{ label: "My Attendance", icon: FiCheckSquare, path: "/student/attendance" }] : []),
            ...(isModuleEnabled("exams") ? [{ label: "My Exams", icon: FiCalendar, path: "/student/exams" }] : []),
            ...(isModuleEnabled("marks") ? [{ label: "My Results", icon: FiFileText, path: "/student/results" }] : []),
            ...(isModuleEnabled("notices") ? [{ label: getLabel("noticeLabel") + "s", icon: FiFileText, path: "/student/notices" }] : []),
            ...(isModuleEnabled("fees") ? [{ label: getLabel("feeLabel") + "s", icon: FiCreditCard, path: "/student/fees" }] : []),
            ...(isModuleEnabled("timetable") ? [{ label: getLabel("timetableLabel"), icon: FiClock, path: "/student/timetable" }] : []),
            ...(isModuleEnabled("assignments") ? [{ label: getLabel("assignmentLabel") + "s", icon: FiEdit, path: "/student/assignments" }] : []),
            ...(isModuleEnabled("library") ? [{ label: getLabel("libraryLabel"), icon: FiBookOpen, path: "/student/library" }] : []),
            ...(isModuleEnabled("transport") ? [{ label: getLabel("transportLabel"), icon: FiTruck, path: "/student/transport" }] : []),
            ...(isModuleEnabled("hostel") ? [
              { label: "My Hostel", icon: FiHome, path: "/student/hostel" },
              { label: "Hostel Outpass", icon: FiFileText, path: "/student/hostel/outpasses" },
              { label: "Hostel Complaints", icon: FiShield, path: "/student/hostel/complaints" },
            ] : []),
          ]
      : user?.role === "parent"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/parent/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/parent/profile" },
            ...(isModuleEnabled("attendance") ? [{ label: "Child Attendance", icon: FiCheckSquare, path: "/parent/attendance" }] : []),
            ...(isModuleEnabled("exams") ? [{ label: "Child Exams", icon: FiCalendar, path: "/parent/exams" }] : []),
            ...(isModuleEnabled("marks") ? [{ label: "Child Results", icon: FiFileText, path: "/parent/results" }] : []),
            ...(isModuleEnabled("notices") ? [{ label: getLabel("noticeLabel") + "s", icon: FiFileText, path: "/parent/notices" }] : []),
            ...(isModuleEnabled("fees") ? [{ label: getLabel("feeLabel") + "s", icon: FiCreditCard, path: "/parent/fees" }] : []),
            ...(isModuleEnabled("timetable") ? [{ label: getLabel("timetableLabel"), icon: FiClock, path: "/parent/timetable" }] : []),
            ...(isModuleEnabled("assignments") ? [{ label: getLabel("assignmentLabel") + "s", icon: FiEdit, path: "/parent/assignments" }] : []),
            ...(isModuleEnabled("library") ? [{ label: "Child Library", icon: FiBookOpen, path: "/parent/library" }] : []),
            ...(isModuleEnabled("transport") ? [{ label: "Child Transport", icon: FiTruck, path: "/parent/transport" }] : []),
            ...(isModuleEnabled("hostel") ? [
              { label: "Child Hostel", icon: FiHome, path: "/parent/hostel" },
              { label: "Hostel Outpasses", icon: FiFileText, path: "/parent/hostel/outpasses" },
              { label: "Hostel Complaints", icon: FiShield, path: "/parent/hostel/complaints" },
            ] : []),
          ]
      : user?.role === "staff"
        ? [
            { label: "Dashboard", icon: FiHome, path: "/staff/dashboard" },
            { label: "My Profile", icon: FiUser, path: "/staff/profile" },
            ...(isModuleEnabled("notices") ? [{ label: getLabel("noticeLabel") + "s", icon: FiFileText, path: "/staff/notices" }] : []),
            ...(canManageLibrary && isModuleEnabled("library")
              ? [
                  { label: getLabel("libraryLabel") + " Books", icon: FiBookOpen, path: "/staff/library/books" },
                  { label: "Book Issues", icon: FiFileText, path: "/staff/library/issues" },
                  { label: "Overdue Books", icon: FiCalendar, path: "/staff/library/issues/overdue" },
                ]
              : []),
            ...(canManageTransportModule && isModuleEnabled("transport")
              ? [
                  { label: getLabel("transportLabel") + " Vehicles", icon: FiTruck, path: "/staff/transport/vehicles" },
                  { label: getLabel("transportLabel") + " Routes", icon: FiMap, path: "/staff/transport/routes" },
                  { label: getLabel("transportLabel") + " Allocations", icon: FiUsers, path: "/staff/transport/allocations" },
                ]
              : []),
            ...(isDriver
              ? [
                  { label: "My Route", icon: FiTruck, path: "/staff/transport/my-route" },
                  { label: "My Students", icon: FiUsers, path: "/staff/transport/my-students" },
                ]
              : []),
            ...(canManageHostelModule && isModuleEnabled("hostel")
              ? [
                  { label: getLabel("hostelLabel") + "s", icon: FiHome, path: "/staff/hostels" },
                  { label: getLabel("hostelLabel") + " Rooms", icon: FiLayers, path: "/staff/hostel-rooms" },
                  { label: getLabel("hostelLabel") + " Beds", icon: FiPackage, path: "/staff/hostel-beds" },
                  { label: getLabel("hostelLabel") + " Allocations", icon: FiUsers, path: "/staff/hostel-allocations" },
                  { label: getLabel("hostelLabel") + " Outpasses", icon: FiFileText, path: "/staff/hostel-outpasses" },
                  { label: getLabel("hostelLabel") + " Complaints", icon: FiShield, path: "/staff/hostel-complaints" },
                ]
              : []),
            ...(isHostelSecurity
              ? [
                  { label: getLabel("hostelLabel") + "s View", icon: FiHome, path: "/staff/hostels" },
                  { label: getLabel("hostelLabel") + " Outpasses", icon: FiFileText, path: "/staff/hostel-outpasses" },
                  { label: getLabel("hostelLabel") + " Complaints", icon: FiShield, path: "/staff/hostel-complaints" },
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
