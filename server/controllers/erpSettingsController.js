import ERPSettings from "../models/ERPSettings.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const sanitizeERPSettings = (settings) => ({
  _id: settings._id,
  instituteId: settings.instituteId,
  appName: settings.appName,
  appShortName: settings.appShortName,
  tagline: settings.tagline,
  logo: settings.logo,
  favicon: settings.favicon,
  primaryColor: settings.primaryColor,
  secondaryColor: settings.secondaryColor,
  accentColor: settings.accentColor,
  sidebarColor: settings.sidebarColor,
  navbarColor: settings.navbarColor,
  backgroundColor: settings.backgroundColor,
  cardColor: settings.cardColor,
  textColor: settings.textColor,
  buttonStyle: settings.buttonStyle,
  themeMode: settings.themeMode,
  loginLayout: settings.loginLayout,
  loginBackground: settings.loginBackground,
  loginHeroTitle: settings.loginHeroTitle,
  loginHeroSubtitle: settings.loginHeroSubtitle,
  footerText: settings.footerText,
  enableDarkMode: settings.enableDarkMode,
  enableCaptcha: settings.enableCaptcha,
  enableRememberMe: settings.enableRememberMe,
  enableForgotPassword: settings.enableForgotPassword,
  defaultLanguage: settings.defaultLanguage,
  dateFormat: settings.dateFormat,
  timeFormat: settings.timeFormat,
  currency: settings.currency,
  timezone: settings.timezone,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const getPublicSettings = async (req, res, next) => {
  try {
    const globalSettings = await ERPSettings.findOne({ instituteId: null });
    const settings = globalSettings || new ERPSettings();
    
    // Return only public-safe settings
    res.json({
      appName: settings.appName,
      appShortName: settings.appShortName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      primaryColor: settings.primaryColor,
      themeMode: settings.themeMode,
      loginLayout: settings.loginLayout,
      loginBackground: settings.loginBackground,
      loginHeroTitle: settings.loginHeroTitle,
      loginHeroSubtitle: settings.loginHeroSubtitle,
      enableCaptcha: settings.enableCaptcha,
      enableRememberMe: settings.enableRememberMe,
      enableForgotPassword: settings.enableForgotPassword,
      footerText: settings.footerText,
    });
  } catch (error) {
    next(error);
  }
};

const getGlobalSettings = async (req, res, next) => {
  try {
    let settings = await ERPSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await ERPSettings.create({ instituteId: null });
    }
    
    res.json({
      erpSettings: sanitizeERPSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalSettings = async (req, res, next) => {
  try {
    let settings = await ERPSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await ERPSettings.create({
        instituteId: null,
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    await createAuditLog({
      req,
      instituteId: null,
      action: "update",
      entity: "erp_settings",
      entityId: settings._id,
      message: "Global ERP settings updated",
    });

    res.json({
      message: "Global ERP settings updated successfully",
      erpSettings: sanitizeERPSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await ERPSettings.findOne({ instituteId });
    
    if (!settings) {
      // Fallback to global settings
      const globalSettings = await ERPSettings.findOne({ instituteId: null });
      settings = globalSettings || new ERPSettings();
    }
    
    res.json({
      erpSettings: sanitizeERPSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstituteSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await ERPSettings.findOne({ instituteId });
    
    if (!settings) {
      settings = await ERPSettings.create({
        instituteId,
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    await createAuditLog({
      req,
      instituteId,
      action: "update",
      entity: "erp_settings",
      entityId: settings._id,
      message: "Institute ERP settings updated",
    });

    res.json({
      message: "Institute ERP settings updated successfully",
      erpSettings: sanitizeERPSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const resetToGlobal = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    const globalSettings = await ERPSettings.findOne({ instituteId: null });
    if (!globalSettings) {
      res.status(404);
      throw new Error("Global settings not found");
    }

    let settings = await ERPSettings.findOne({ instituteId });
    
    if (settings) {
      // Copy global settings to institute settings
      Object.assign(settings, globalSettings.toObject());
      settings.instituteId = instituteId;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      // Create new institute settings from global
      settings = await ERPSettings.create({
        instituteId,
        ...globalSettings.toObject(),
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId,
      action: "reset",
      entity: "erp_settings",
      entityId: settings._id,
      message: "Institute ERP settings reset to global defaults",
    });

    res.json({
      message: "Institute ERP settings reset to global defaults successfully",
      erpSettings: sanitizeERPSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPublicSettings,
  getGlobalSettings,
  updateGlobalSettings,
  getInstituteSettings,
  updateInstituteSettings,
  resetToGlobal,
};
