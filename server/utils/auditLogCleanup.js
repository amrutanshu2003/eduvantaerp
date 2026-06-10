import AuditLogSettings from "../models/AuditLogSettings.js";
import AuditLog from "../models/AuditLog.js";

const getRetentionDays = (settings) => {
  switch (settings.retentionPeriod) {
    case "3months":
      return 90;
    case "6months":
      return 180;
    case "1year":
      return 365;
    case "custom":
      return settings.customRetentionDays;
    default:
      return 180;
  }
};

export const autoDeleteAuditLogs = async () => {
  try {
    const settings = await AuditLogSettings.findOne();

    if (!settings || !settings.autoDeleteEnabled) {
      return;
    }

    const retentionDays = getRetentionDays(settings);
    const deleteBeforeDate = new Date();
    deleteBeforeDate.setDate(deleteBeforeDate.getDate() - retentionDays);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: deleteBeforeDate },
    });

    if (result.deletedCount > 0) {
      console.log(`Auto-deleted ${result.deletedCount} audit logs older than ${retentionDays} days`);
    }

    settings.lastAutoDeleteRun = new Date();
    await settings.save();
  } catch (error) {
    console.error("Audit log auto-delete failed:", error);
  }
};
