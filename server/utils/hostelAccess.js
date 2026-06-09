const canManageHostel = (user) =>
  user?.role === "admin" ||
  user?.role === "superadmin" ||
  (user?.role === "staff" &&
    (user?.designation === "hostel_warden" || (user?.permissions || []).includes("hostel.manage")));

const canViewHostel = (user) =>
  canManageHostel(user) ||
  (user?.role === "staff" && user?.designation === "hostel_security");

const isHostelSecurityUser = (user) => user?.role === "staff" && user?.designation === "hostel_security";
const canViewHostelWorkflow = (user) => canManageHostel(user) || isHostelSecurityUser(user);

const requireHostelManager = (req, res, next) => {
  if (!canManageHostel(req.user)) {
    res.status(403);
    return next(new Error("Hostel management access required"));
  }

  next();
};

const requireHostelViewer = (req, res, next) => {
  if (!canViewHostel(req.user)) {
    res.status(403);
    return next(new Error("Hostel access required"));
  }

  next();
};

const requireHostelWorkflowViewer = (req, res, next) => {
  if (!canViewHostelWorkflow(req.user)) {
    res.status(403);
    return next(new Error("Hostel workflow access required"));
  }

  next();
};

export {
  canManageHostel,
  canViewHostel,
  canViewHostelWorkflow,
  isHostelSecurityUser,
  requireHostelManager,
  requireHostelViewer,
  requireHostelWorkflowViewer,
};
