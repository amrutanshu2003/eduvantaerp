import AuditLogSettings from "../models/AuditLogSettings.js";
import AuditLog from "../models/AuditLog.js";

const getAuditLogSettings = async (req, res, next) => {
  try {
    let settings = await AuditLogSettings.findOne();
    
    if (!settings) {
      settings = await AuditLogSettings.create({});
    }

    res.json({
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateAuditLogSettings = async (req, res, next) => {
  try {
    const { autoDeleteEnabled, retentionPeriod, customRetentionDays } = req.body;

    let settings = await AuditLogSettings.findOne();
    
    if (!settings) {
      settings = new AuditLogSettings();
    }

    if (typeof autoDeleteEnabled === "boolean") {
      settings.autoDeleteEnabled = autoDeleteEnabled;
    }

    if (retentionPeriod && ["3months", "6months", "1year", "custom"].includes(retentionPeriod)) {
      settings.retentionPeriod = retentionPeriod;
    }

    if (customRetentionDays !== undefined) {
      settings.customRetentionDays = Math.max(7, Math.min(3650, customRetentionDays));
    }

    await settings.save();

    res.json({
      message: "Audit log settings updated successfully",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAuditLogs = async (req, res, next) => {
  try {
    const { days = 7, clearAll = false } = req.body;
    let query = {};
    let msg = "";

    if (clearAll) {
      query = {};
      msg = "Permanently deleted all audit logs";
    } else {
      const deleteBeforeDate = new Date();
      deleteBeforeDate.setDate(deleteBeforeDate.getDate() - days);
      query = { createdAt: { $lt: deleteBeforeDate } };
      msg = `Deleted audit logs older than ${days} days`;
    }

    const result = await AuditLog.deleteMany(query);

    res.json({
      message: `${msg} successfully. (${result.deletedCount} logs removed permanently)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

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

const runAutoDelete = async (req, res, next) => {
  try {
    const settings = await AuditLogSettings.findOne();

    if (!settings || !settings.autoDeleteEnabled) {
      res.status(400);
      throw new Error("Auto-delete is not enabled");
    }

    const retentionDays = getRetentionDays(settings);
    const deleteBeforeDate = new Date();
    deleteBeforeDate.setDate(deleteBeforeDate.getDate() - retentionDays);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: deleteBeforeDate },
    });

    settings.lastAutoDeleteRun = new Date();
    await settings.save();

    res.json({
      message: `Auto-delete completed. Deleted ${result.deletedCount} audit logs older than ${retentionDays} days`,
      deletedCount: result.deletedCount,
      retentionDays,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAuditLogSettings,
  updateAuditLogSettings,
  deleteAuditLogs,
  runAutoDelete,
};
