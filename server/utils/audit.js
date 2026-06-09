import AuditLog from "../models/AuditLog.js";

const createAuditLog = async ({
  req,
  instituteId = null,
  action,
  entity,
  entityId = null,
  message,
  metadata = {},
}) => {
  await AuditLog.create({
    instituteId,
    userId: req.user?._id || null,
    actorId: req.user?._id || null,
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
