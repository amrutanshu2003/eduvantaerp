import AuditLog from "../models/AuditLog.js";
import UISettings from "../models/UISettings.js";
import bcrypt from "bcryptjs";

const defaultAcademicConfig = {
  school: {
    allowedSchoolLevels: ["Pre-Primary", "Primary", "Middle", "Secondary"],
    maxClassNumber: 10,
  },
  college: {
    allowedSchoolLevels: ["Higher Secondary"],
    allowedProgramLevels: ["UG", "PG", "Diploma", "Certificate"],
    maxClassNumber: 12,
  },
  university: {
    allowedProgramLevels: ["UG", "PG", "PhD", "Diploma", "Certificate"],
  },
};

const defaultGlobalSettings = {
  instituteId: null,
  appName: "Eduvanta ERP",
  logo: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  sidebarColor: "#0f172a",
  loginBackground: "",
  buttonStyle: "rounded",
  themeMode: "system",
  footerText: "Smart ERP for Schools, Colleges & Universities",
  captchaEnabled: true,
  privilegedRecoveryEnabled: false,
  privilegedRecoveryHint: "",
  customSidebarItems: [],
  academicConfig: defaultAcademicConfig,
};

const sanitizeSettings = (settings) => {
  if (!settings) {
    return defaultGlobalSettings;
  }

  const plainSettings = settings.toObject ? settings.toObject() : settings;
  const { privilegedRecoveryKeyHash, ...safeSettings } = plainSettings;
  return safeSettings;
};

const getGlobalUISettings = async (req, res, next) => {
  try {
    const settings = await UISettings.findOne({ instituteId: null });

    res.json({
      settings: sanitizeSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalUISettings = async (req, res, next) => {
  try {
    const payload = {
      appName: req.body.appName?.trim() || defaultGlobalSettings.appName,
      logo: req.body.logo?.trim() || "",
      primaryColor: req.body.primaryColor?.trim() || defaultGlobalSettings.primaryColor,
      secondaryColor: req.body.secondaryColor?.trim() || defaultGlobalSettings.secondaryColor,
      sidebarColor: req.body.sidebarColor?.trim() || defaultGlobalSettings.sidebarColor,
      loginBackground: req.body.loginBackground?.trim() || "",
      buttonStyle: req.body.buttonStyle || defaultGlobalSettings.buttonStyle,
      themeMode: req.body.themeMode || defaultGlobalSettings.themeMode,
      footerText: req.body.footerText?.trim() || defaultGlobalSettings.footerText,
      captchaEnabled: typeof req.body.captchaEnabled === "boolean" ? req.body.captchaEnabled : defaultGlobalSettings.captchaEnabled,
      customSidebarItems: Array.isArray(req.body.customSidebarItems)
        ? req.body.customSidebarItems
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              label: item.label?.trim(),
              path: item.path?.trim(),
              iconKey: item.iconKey?.trim() || "info",
            }))
            .filter((item) => item.label && item.path)
        : defaultGlobalSettings.customSidebarItems,
      privilegedRecoveryEnabled:
        typeof req.body.privilegedRecoveryEnabled === "boolean"
          ? req.body.privilegedRecoveryEnabled
          : defaultGlobalSettings.privilegedRecoveryEnabled,
      privilegedRecoveryHint: req.body.privilegedRecoveryHint?.trim() || "",
      instituteId: null,
    };

    if (req.body.academicConfig && typeof req.body.academicConfig === "object") {
      const ac = req.body.academicConfig;
      payload.academicConfig = {
        school: {
          allowedSchoolLevels: Array.isArray(ac.school?.allowedSchoolLevels)
            ? ac.school.allowedSchoolLevels
            : defaultAcademicConfig.school.allowedSchoolLevels,
          maxClassNumber: typeof ac.school?.maxClassNumber === "number"
            ? ac.school.maxClassNumber
            : defaultAcademicConfig.school.maxClassNumber,
        },
        college: {
          allowedSchoolLevels: Array.isArray(ac.college?.allowedSchoolLevels)
            ? ac.college.allowedSchoolLevels
            : defaultAcademicConfig.college.allowedSchoolLevels,
          allowedProgramLevels: Array.isArray(ac.college?.allowedProgramLevels)
            ? ac.college.allowedProgramLevels
            : defaultAcademicConfig.college.allowedProgramLevels,
          maxClassNumber: typeof ac.college?.maxClassNumber === "number"
            ? ac.college.maxClassNumber
            : defaultAcademicConfig.college.maxClassNumber,
        },
        university: {
          allowedProgramLevels: Array.isArray(ac.university?.allowedProgramLevels)
            ? ac.university.allowedProgramLevels
            : defaultAcademicConfig.university.allowedProgramLevels,
        },
      };
    }

    if (!["rounded", "pill", "square"].includes(payload.buttonStyle)) {
      res.status(400);
      throw new Error("Button style must be rounded, pill, or square");
    }

    if (!["light", "dark", "system"].includes(payload.themeMode)) {
      res.status(400);
      throw new Error("Theme mode must be light, dark, or system");
    }

    if (req.body.clearPrivilegedRecoveryKey === true) {
      payload.privilegedRecoveryKeyHash = "";
      payload.privilegedRecoveryEnabled = false;
    } else if (req.body.privilegedRecoveryKey?.trim()) {
      payload.privilegedRecoveryKeyHash = await bcrypt.hash(req.body.privilegedRecoveryKey.trim(), 10);
    }

    const settings = await UISettings.findOneAndUpdate({ instituteId: null }, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: "update",
      module: "global_ui_settings",
      targetId: settings._id,
      targetType: "UISettings",
      metadata: { themeMode: settings.themeMode },
      ipAddress: req.ip,
    });

    res.json({
      message: "Global UI settings updated successfully",
      settings: sanitizeSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export { getGlobalUISettings, updateGlobalUISettings, defaultGlobalSettings };
