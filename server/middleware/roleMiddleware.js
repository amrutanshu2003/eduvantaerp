const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error("Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error("Access denied for this role"));
  }

  next();
};

export default allowRoles;
