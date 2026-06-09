const canManageLibrary = (user) => {
  if (!user) return false;
  if (user.role === "admin" || user.role === "superadmin") return true;

  return user.role === "staff" && (user.designation === "librarian" || (user.permissions || []).includes("library.manage"));
};

const requireLibraryManager = (req, res, next) => {
  if (!canManageLibrary(req.user)) {
    res.status(403);
    return next(new Error("Access denied for library management"));
  }

  next();
};

export { canManageLibrary, requireLibraryManager };
