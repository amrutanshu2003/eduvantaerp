import AuditLog from "../models/AuditLog.js";
import UISettings from "../models/UISettings.js";

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
};

const getGlobalUISettings = async (req, res, next) => {
  try {
    const settings = await UISettings.findOne({ instituteId: null });

    res.json({
      settings: settings || defaultGlobalSettings,
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

    const settings = await UISettings.findOneAndUpdate({ instituteId: null }, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
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
      settings,
    });
  } catch (error) {
    next(error);
  }
};

export { getGlobalUISettings, updateGlobalUISettings, defaultGlobalSettings };
