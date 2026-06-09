const canManageTransport = (user) =>
  user?.role === "admin" ||
  user?.role === "superadmin" ||
  (user?.role === "staff" &&
    (user?.designation === "transport_staff" || (user?.permissions || []).includes("transport.manage")));

const isDriverUser = (user) => user?.role === "staff" && user?.designation === "driver";

const requireTransportManager = (req, res, next) => {
  if (!canManageTransport(req.user)) {
    res.status(403);
    return next(new Error("Transport management access required"));
  }

  next();
};

const requireDriver = (req, res, next) => {
  if (!isDriverUser(req.user)) {
    res.status(403);
    return next(new Error("Driver access required"));
  }

  next();
};

export { canManageTransport, isDriverUser, requireTransportManager, requireDriver };
