import AuditLog from "../models/AuditLog.js";
import UISettings from "../models/UISettings.js";
import bcrypt from "bcryptjs";

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
      privilegedRecoveryEnabled:
        typeof req.body.privilegedRecoveryEnabled === "boolean"
          ? req.body.privilegedRecoveryEnabled
          : defaultGlobalSettings.privilegedRecoveryEnabled,
      privilegedRecoveryHint: req.body.privilegedRecoveryHint?.trim() || "",
      instituteId: null,
    };

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
