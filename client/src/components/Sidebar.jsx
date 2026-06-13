import { useState, useEffect, useRef } from "react";
import { FiBook, FiBookOpen, FiCalendar, FiCheckSquare, FiChevronDown, FiChevronRight, FiClock, FiCreditCard, FiEdit, FiFileText, FiHome, FiLayers, FiMap, FiPackage, FiPlusSquare, FiSettings, FiShield, FiTrash2, FiTruck, FiUser, FiUsers } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import { useLabelSettings } from "../context/LabelSettingsContext";
import { canManageHostel, isHostelSecurityUser } from "../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../utils/transportAccess";
import { normalizeCustomSidebarItem } from "../utils/iconRegistry";

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

const defaultCollapsedGroups = {
  core: true,
  institute: true,
  academicSetup: true,
  academics: true,
  operations: true,
  services: true,
  system: true,
};

const defaultCollapsedServiceGroups = {
  transport: true,
  hostel: true,
  library: true,
};

const getGroupForLabel = (label) => {
  const l = label.toLowerCase();

  if (l === "dashboard" || l === "my profile") {
    return "core";
  }
  if (
    l === "institutes" ||
    l === "create institute" ||
    l === "institute settings" ||
    l === "bulk-import" ||
    l === "bulk import"
  ) {
    return "institute";
  }
  if (
    l.includes("academic") ||
    l.includes("subject") ||
    l.includes("exam") ||
    l.includes("mark") ||
    l.includes("result") ||
    l.includes("timetable") ||
    l.includes("assignment")
  ) {
    return "academics";
  }
  if (
    l === "admins" ||
    l.includes("teacher") ||
    l.includes("faculty") ||
    l.includes("student") ||
    l.includes("parent") ||
    l.includes("guardian") ||
    l.includes("staff") ||
    l.includes("attendance") ||
    l.includes("fee")
  ) {
    if (l === "my students") return "services";
    return "operations";
  }
  if (
    l.includes("library") ||
    l.includes("book") ||
    l.includes("transport") ||
    l.includes("vehicle") ||
    l.includes("route") ||
    l.includes("allocation") ||
    l.includes("hostel") ||
    l.includes("room") ||
    l.includes("bed") ||
    l.includes("outpass") ||
    l.includes("complaint") ||
    l.includes("driver")
  ) {
    return "services";
  }
  if (
    l === "settings" ||
    l === "global settings" ||
    l === "global ui settings" ||
    l === "audit log settings" ||
    l === "recycle bin" ||
    l.includes("notice")
  ) {
    return "system";
  }

  return "core";
};

const getGroupForItem = (item) => item.group || getGroupForLabel(item.label);

const serviceGroupConfig = [
  {
    id: "transport",
    label: "Transport",
    icon: FiTruck,
    matcher: (item) => item.path?.includes("/transport"),
  },
  {
    id: "hostel",
    label: "Hostel",
    icon: FiHome,
    matcher: (item) => item.path?.includes("/hostel") || item.path?.includes("/hostels"),
  },
  {
    id: "library",
    label: "Library",
    icon: FiBook,
    matcher: (item) => item.path?.includes("/library"),
  },
];

const getServiceGroupForItem = (item) => serviceGroupConfig.find((group) => group.matcher(item))?.id || null;

const getServiceItemLabel = (item, serviceGroupId) => {
  const label = item.label || "";

  if (serviceGroupId === "transport") {
    return label
      .replace(/^child transport$/i, "Overview")
      .replace(/^transport$/i, "Overview")
      .replace(/^my route$/i, "My Route")
      .replace(/^my students$/i, "My Students")
      .replace(/^transport\s+/i, "");
  }

  if (serviceGroupId === "hostel") {
    return label
      .replace(/^child hostel$/i, "Overview")
      .replace(/^my hostel$/i, "Overview")
      .replace(/^hostels view$/i, "Overview")
      .replace(/^hostels$/i, "Hostels")
      .replace(/^hostel\s+/i, "");
  }

  if (serviceGroupId === "library") {
    return label
      .replace(/^child library$/i, "Overview")
      .replace(/^my library$/i, "Overview")
      .replace(/^library$/i, "Overview")
      .replace(/^library books$/i, "Books")
      .replace(/^book issues$/i, "Issues")
      .replace(/^overdue books$/i, "Overdue");
  }

  return label;
};

const getServiceItemIcon = (item, serviceGroupId) => {
  const label = getServiceItemLabel(item, serviceGroupId).toLowerCase();

  if (serviceGroupId === "transport") {
    if (label.includes("vehicle")) return FiTruck;
    if (label.includes("route")) return FiMap;
    if (label.includes("allocation")) return FiUsers;
    if (label.includes("student")) return FiUsers;
    return FiTruck;
  }

  if (serviceGroupId === "hostel") {
    if (label.includes("room")) return FiLayers;
    if (label.includes("bed")) return FiPackage;
    if (label.includes("allocation")) return FiUsers;
    if (label.includes("outpass")) return FiFileText;
    if (label.includes("complaint")) return FiShield;
    return FiHome;
  }

  if (serviceGroupId === "library") {
    if (label.includes("book")) return FiBookOpen;
    if (label.includes("issue")) return FiFileText;
    if (label.includes("overdue")) return FiCalendar;
    return FiBook;
  }

  return FiFileText;
};

const matchesPath = (pathname, itemPath) => pathname === itemPath || pathname.startsWith(`${itemPath}/`);

const isServiceItemActive = (pathname, item) => {
  if (!item?.path) {
    return false;
  }

  if (matchesPath(pathname, item.path)) {
    return true;
  }

  if (item.path.endsWith("/hostel-rooms")) {
    return /\/hostels\/[^/]+\/rooms(\/|$)/.test(pathname);
  }

  if (item.path.endsWith("/hostel-beds")) {
    return /\/hostel-rooms\/[^/]+\/beds(\/|$)/.test(pathname);
  }

  if (item.path.includes("/library/issues")) {
    return /\/library\/students\/[^/]+\/history(\/|$)/.test(pathname);
  }

  return false;
};

const Sidebar = () => {
  const { user } = useAuth();
  const { settings, resolvedTheme } = useUISettings();
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
  const customSidebarItems = (settings.customSidebarItems || []).map(normalizeCustomSidebarItem);

  const storageKey = `sidebar_collapsed_${user?._id || user?.role || "default"}`;
  const serviceStorageKey = `sidebar_service_collapsed_${user?._id || user?.role || "default"}`;
  const isInitialMount = useRef(true);
  const lastLoadedKeyRef = useRef(storageKey);
  const lastLoadedServiceKeyRef = useRef(serviceStorageKey);

  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultCollapsedGroups, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return defaultCollapsedGroups;
  });
  const [collapsedServiceGroups, setCollapsedServiceGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(serviceStorageKey);
      if (saved) {
        return { ...defaultCollapsedServiceGroups, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return defaultCollapsedServiceGroups;
  });

  // Load state when key changes (login/logout/refresh)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCollapsedGroups({ ...defaultCollapsedGroups, ...JSON.parse(saved) });
      } else {
        setCollapsedGroups(defaultCollapsedGroups);
      }
      lastLoadedKeyRef.current = storageKey;
      isInitialMount.current = true; // reset mount tracker for path auto-expand
    } catch (e) {
      console.error(e);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(serviceStorageKey);
      if (saved) {
        setCollapsedServiceGroups({ ...defaultCollapsedServiceGroups, ...JSON.parse(saved) });
      } else {
        setCollapsedServiceGroups(defaultCollapsedServiceGroups);
      }
      lastLoadedServiceKeyRef.current = serviceStorageKey;
    } catch (e) {
      console.error(e);
    }
  }, [serviceStorageKey]);

  // Save state when collapsedGroups changes, but only if synced with current storageKey
  useEffect(() => {
    if (storageKey === lastLoadedKeyRef.current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(collapsedGroups));
      } catch (e) {
        console.error(e);
      }
    }
  }, [collapsedGroups, storageKey]);

  useEffect(() => {
    if (serviceStorageKey === lastLoadedServiceKeyRef.current) {
      try {
        localStorage.setItem(serviceStorageKey, JSON.stringify(collapsedServiceGroups));
      } catch (e) {
        console.error(e);
      }
    }
  }, [collapsedServiceGroups, serviceStorageKey]);

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => {
      const isOpening = prev[groupId];
      if (isOpening) {
        // Collapse all other groups, expand the clicked one
        return {
          ...defaultCollapsedGroups,
          [groupId]: false,
        };
      } else {
        // Collapse the clicked group
        return {
          ...prev,
          [groupId]: true,
        };
      }
    });
  };

  const toggleServiceGroup = (serviceGroupId) => {
    setCollapsedServiceGroups((prev) => ({
      ...prev,
      [serviceGroupId]: !prev[serviceGroupId],
    }));
  };

  // Helper functions to get plural labels
  const getSidebarAcademicGroupLabel = () => "Academic Groups";

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
    { label: "My Profile", icon: FiUser, path: "/super-admin/profile" },
    { label: "Institutes", icon: FiUsers, path: "/super-admin/institutes" },
    { label: "Create Institute", icon: FiPlusSquare, path: "/super-admin/institutes/create" },
    { label: "Global Settings", icon: FiSettings, path: "/super-admin/settings", group: "system" },
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
      newItem.label = getSidebarAcademicGroupLabel();
      newItem.group = "academicSetup";
    } else if (newItem.label === "Teachers") {
      newItem.label = getTeacherLabelPlural();
      adminItemsForSuper.push({ label: "Admins", icon: FiShield, path: "/super-admin/admins" });
    } else if (newItem.label === "Parents") {
      newItem.label = getParentLabelPlural();
    } else if (newItem.label === "Subjects") {
      newItem.label = getSubjectLabelPlural();
      newItem.group = "academicSetup";
    }
    adminItemsForSuper.push(newItem);
  });

  const menuItems =
    user?.role === "superadmin"
      ? [
        ...superAdminItems,
        ...adminItemsForSuper,
        ...customSidebarItems.map((item) => ({
          label: item.label,
          icon: item.icon.component,
          path: item.path,
        })),
      ]
      : user?.role === "admin"
        ? [
          { label: "Dashboard", icon: FiHome, path: "/admin/dashboard" },
          { label: "My Profile", icon: FiUser, path: "/admin/profile" },
          { label: "Institute Settings", icon: FiSettings, path: "/admin/settings" },
          { label: "Bulk Import", icon: FiPlusSquare, path: "/admin/bulk-import" },
          { label: getSidebarAcademicGroupLabel(), icon: FiBookOpen, path: "/admin/academic-groups", group: "academicSetup" },
          ...(isModuleEnabled("teachers") ? [{ label: getTeacherLabelPlural(), icon: FiUser, path: "/admin/teachers" }] : []),
          ...(isModuleEnabled("students") ? [{ label: getLabel("studentLabel") + "s", icon: FiUsers, path: "/admin/students" }] : []),
          ...(isModuleEnabled("parents") ? [{ label: getParentLabelPlural(), icon: FiShield, path: "/admin/parents" }] : []),
          ...(isModuleEnabled("staff") ? [{ label: getLabel("staffLabel") + "s", icon: FiLayers, path: "/admin/staff" }] : []),
          ...(isModuleEnabled("subjects") ? [{ label: getSubjectLabelPlural(), icon: FiBookOpen, path: "/admin/subjects", group: "academicSetup" }] : []),
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
          ...customSidebarItems.map((item) => ({
            label: item.label,
            icon: item.icon.component,
            path: item.path,
          })),
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
            ...customSidebarItems.map((item) => ({
              label: item.label,
              icon: item.icon.component,
              path: item.path,
            })),
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
              ...customSidebarItems.map((item) => ({
                label: item.label,
                icon: item.icon.component,
                path: item.path,
              })),
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
                ...customSidebarItems.map((item) => ({
                  label: item.label,
                  icon: item.icon.component,
                  path: item.path,
                })),
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
                  ...customSidebarItems.map((item) => ({
                    label: item.label,
                    icon: item.icon.component,
                    path: item.path,
                  })),
                ]
                : defaultMenuItems.map((item) => ({ ...item, path: `${basePath}/${item.suffix}` }));

  const location = useLocation();

  // Save current path to localStorage whenever route changes
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    
    // Don't save login, logout, unauthorized, or root paths
    if (path && path !== "/" && path !== "/login" && path !== "/logout" && path !== "/unauthorized") {
      // Ensure the path matches the user's role prefix
      const isSuperAdminAllowed = user.role === "superadmin" && (path.startsWith("/super-admin") || path.startsWith("/admin"));
      const isRegularRoleAllowed = path.startsWith(`/${user.role}`);
      
      if (isSuperAdminAllowed || isRegularRoleAllowed) {
        localStorage.setItem(
          `last_path_${user?._id || user?.role || "default"}`,
          path + location.search + location.hash
        );
      }
    }
  }, [location.pathname, location.search, location.hash, user]);

  // Handle sidebar group auto-expansion on active navigation (excludes initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const activeItem = menuItems
      .filter((item) => item.path && location.pathname.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length)[0];

    if (activeItem) {
      const activeGroup = getGroupForItem(activeItem);
      setCollapsedGroups((prev) => {
        if (prev[activeGroup] === false) return prev;
        if (activeGroup === "core") {
          // Navigating to core (Dashboard/Profile) expands core but does NOT collapse other groups
          return {
            ...prev,
            core: false,
          };
        } else {
          // Navigating to other modules expands the target group and collapses all others
          return {
            ...defaultCollapsedGroups,
            [activeGroup]: false,
          };
        }
      });

      if (activeGroup === "services") {
        const activeServiceGroup = getServiceGroupForItem(activeItem);
        if (activeServiceGroup) {
          setCollapsedServiceGroups((prev) => ({
            ...prev,
            [activeServiceGroup]: false,
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Group items
  const groupedItems = {
    core: [],
    institute: [],
    academicSetup: [],
    academics: [],
    operations: [],
    services: [],
    system: [],
  };

  menuItems.forEach((item) => {
    const group = getGroupForItem(item);
    groupedItems[group].push(item);
  });

  const serviceItemsByGroup = serviceGroupConfig.reduce((acc, group) => {
    acc[group.id] = groupedItems.services.filter((item) => getServiceGroupForItem(item) === group.id);
    return acc;
  }, {});

  const groupsConfig = [
    { id: "core", name: "CORE", icon: FiHome },
    { id: "institute", name: "INSTITUTE", icon: FiLayers },
    { id: "academicSetup", name: "ACADEMIC SETUP", icon: FiBookOpen },
    { id: "academics", name: "ACADEMICS", icon: FiBookOpen },
    { id: "operations", name: "OPERATIONS", icon: FiUsers },
    { id: "services", name: "SERVICES", icon: FiTruck },
    { id: "system", name: "SYSTEM", icon: FiSettings },
  ];

  const groupsToShow = groupsConfig.filter((g) => groupedItems[g.id].length > 0);

  return (
    <aside
      className={`flex w-full flex-col overflow-x-hidden px-5 py-6 md:h-screen md:w-72 md:flex-shrink-0 md:overflow-hidden ${isDark ? "text-white" : "text-slate-900"
        }`}
      style={sidebarStyle}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`rounded-3xl p-5 shadow-card ${isDark ? "bg-white/10" : "bg-white/90 ring-1 ring-slate-200/80 backdrop-blur"}`}>
          <p className={`text-xs uppercase tracking-[0.35em] ${isDark ? "text-brand-100" : "text-slate-500"}`}>Control Center</p>
          <h2 className={`mt-3 text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{settings.appName}</h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{roleLabels[user?.role] || "ERP User"}</p>
        </div>

        <nav className="mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto no-scrollbar scroll-smooth pr-1">
          {groupsToShow.map((group) => {
            const groupItems = groupedItems[group.id];
            const isCollapsed = collapsedGroups[group.id];
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-1.5">
                <button
                  onClick={() => toggleGroup(group.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors rounded-xl ${isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon size={16} />
                    <span>{group.name}</span>
                  </div>
                  {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 pl-1 transition-all duration-300">
                    {group.id === "services"
                      ? serviceGroupConfig.map((serviceGroup) => {
                        const serviceItems = serviceItemsByGroup[serviceGroup.id] || [];
                        if (serviceItems.length === 0) {
                          return null;
                        }

                        const ServiceIcon = serviceGroup.icon;
                        const serviceGroupActive = serviceItems.some((item) => isServiceItemActive(location.pathname, item));
                        const hasNestedItems = serviceItems.length > 1;
                        const isServiceCollapsed = collapsedServiceGroups[serviceGroup.id];

                        if (!hasNestedItems) {
                          const onlyItem = serviceItems[0];
                          return (
                            <NavLink
                              key={serviceGroup.id}
                              to={onlyItem.path}
                              className={() =>
                                `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                                  serviceGroupActive
                                    ? isDark ? "text-white shadow-sm border-l-4" : "shadow-sm border-l-4"
                                    : isDark
                                      ? "text-slate-300 hover:bg-white/10 hover:text-white border-l-4 border-l-transparent"
                                      : "text-slate-700 hover:bg-white hover:text-slate-950 border-l-4 border-l-transparent"
                                }`
                              }
                              style={() => (serviceGroupActive ? {
                                backgroundColor: isDark ? settings.primaryColor : `color-mix(in srgb, ${settings.primaryColor} 10%, transparent)`,
                                color: isDark ? "#ffffff" : settings.primaryColor,
                                borderLeftColor: "#14b8a6",
                                boxShadow: isDark
                                  ? `0 4px 14px 0 ${settings.primaryColor}40`
                                  : "0 4px 12px 0 rgba(20, 184, 166, 0.08)",
                              } : undefined)}
                            >
                              <ServiceIcon size={16} />
                              <span className="truncate">{serviceGroup.label}</span>
                            </NavLink>
                          );
                        }

                        return (
                          <div key={serviceGroup.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => toggleServiceGroup(serviceGroup.id)}
                              className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                                serviceGroupActive
                                  ? isDark ? "bg-white/10 text-white" : "bg-white text-slate-950 shadow-sm"
                                  : isDark
                                    ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                    : "text-slate-700 hover:bg-white hover:text-slate-950"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ServiceIcon size={16} />
                                <span className="truncate">{serviceGroup.label}</span>
                              </div>
                              {isServiceCollapsed ? <FiChevronRight size={15} /> : <FiChevronDown size={15} />}
                            </button>

                            {!isServiceCollapsed ? (
                              <div className="space-y-1 pl-5">
                                {serviceItems.map((item) => {
                                  const itemActive = isServiceItemActive(location.pathname, item);
                                  const ItemIcon = getServiceItemIcon(item, serviceGroup.id);
                                  return (
                                    <NavLink
                                      key={item.path}
                                      to={item.path}
                                      className={() =>
                                        `flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition ${
                                          itemActive
                                            ? isDark ? "bg-white/10 text-white" : "bg-white text-slate-950 shadow-sm"
                                            : isDark
                                              ? "text-slate-400 hover:bg-white/5 hover:text-white"
                                              : "text-slate-600 hover:bg-white hover:text-slate-900"
                                        }`
                                      }
                                      style={() => (itemActive ? { color: isDark ? "#ffffff" : settings.primaryColor } : undefined)}
                                    >
                                      <ItemIcon
                                        size={14}
                                        className="shrink-0"
                                        style={{ color: itemActive ? settings.primaryColor : isDark ? "#94a3b8" : "#64748b" }}
                                      />
                                      <span className="truncate">{getServiceItemLabel(item, serviceGroup.id)}</span>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                      : groupItems.map(({ label, icon: Icon, path }) => (
                        <NavLink
                          key={path}
                          to={path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? isDark ? "text-white shadow-sm border-l-4" : "shadow-sm border-l-4"
                                : isDark
                                  ? "text-slate-300 hover:bg-white/10 hover:text-white border-l-4 border-l-transparent"
                                  : "text-slate-700 hover:bg-white hover:text-slate-950 border-l-4 border-l-transparent"
                            }`
                          }
                          style={({ isActive }) => (isActive ? {
                            backgroundColor: isDark ? settings.primaryColor : `color-mix(in srgb, ${settings.primaryColor} 10%, transparent)`,
                            color: isDark ? "#ffffff" : settings.primaryColor,
                            borderLeftColor: "#14b8a6",
                            boxShadow: isDark
                              ? `0 4px 14px 0 ${settings.primaryColor}40`
                              : "0 4px 12px 0 rgba(20, 184, 166, 0.08)",
                          } : undefined)}
                        >
                          <Icon size={16} />
                          <span className="truncate">{label}</span>
                        </NavLink>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
