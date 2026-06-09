const getScopedInstituteId = (req, allowSuperAdminOverride = true) => {
  if (req.user?.role === "superadmin") {
    return req.headers["x-institute-id"] || req.body.instituteId || req.query.instituteId || req.params.instituteId || null;
  }

  return req.user?.instituteId?._id || req.user?.instituteId || null;
};

const ensureInstituteScope = (req, instituteId) => {
  if (req.user?.role === "superadmin") {
    return true;
  }

  const currentInstituteId = String(req.user?.instituteId?._id || req.user?.instituteId || "");
  return currentInstituteId && currentInstituteId === String(instituteId);
};

export { getScopedInstituteId, ensureInstituteScope };
