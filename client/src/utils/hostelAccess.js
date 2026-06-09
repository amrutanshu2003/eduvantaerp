const canManageHostel = (user) =>
  user?.role === "admin" ||
  user?.role === "superadmin" ||
  (user?.role === "staff" &&
    (user?.designation === "hostel_warden" || (user?.permissions || []).includes("hostel.manage")));

const canViewHostel = (user) =>
  canManageHostel(user) || (user?.role === "staff" && user?.designation === "hostel_security");

const isHostelSecurityUser = (user) => user?.role === "staff" && user?.designation === "hostel_security";
const canViewHostelWorkflow = (user) => canManageHostel(user) || isHostelSecurityUser(user);

export { canManageHostel, canViewHostel, canViewHostelWorkflow, isHostelSecurityUser };
