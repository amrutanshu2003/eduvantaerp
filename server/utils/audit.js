import AuditLog from "../models/AuditLog.js";

const roleToModel = {
  superadmin: "SuperAdmin",
  admin: "Admin",
  teacher: "Teacher",
  staff: "StaffMember",
  student: "Student",
  parent: "Parent"
};

const createAuditLog = async ({
  req,
  instituteId = null,
  action,
  entity,
  entityId = null,
  message,
  metadata = {},
}) => {
  const userRole = req.user?.role;
  const userModel = userRole ? roleToModel[userRole] : "Admin";

  await AuditLog.create({
    instituteId,
    userId: req.user?._id || null,
    userModel,
    actorId: req.user?._id || null,
    actorModel: userModel,
    action,
    module: entity,
    entity,
    entityId,
    targetId: entityId,
    targetType: entity,
    message,
    metadata,
    ipAddress: req.ip,
  });
};

export default createAuditLog;
