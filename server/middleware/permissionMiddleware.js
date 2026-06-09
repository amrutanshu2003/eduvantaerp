const requirePermissions = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error("Authentication required"));
  }

  if (req.user.role === "superadmin") {
    return next();
  }

  const userPermissions = req.user.permissions || [];
  const hasPermissions = requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );

  if (!hasPermissions) {
    res.status(403);
    return next(new Error("Permission denied"));
  }

  next();
};

export default requirePermissions;
