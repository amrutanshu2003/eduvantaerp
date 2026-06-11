import ModuleSettings from "../models/ModuleSettings.js";
import createAuditLog from "../utils/audit.js";
import { getScopedInstituteId } from "../utils/scope.js";

const sanitizeModuleSettings = (settings) => ({
  _id: settings._id,
  instituteId: settings.instituteId,
  modules: settings.modules,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const getGlobalModuleSettings = async (req, res, next) => {
  try {
    let settings = await ModuleSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await ModuleSettings.create({ instituteId: null });
    }
    
    res.json({
      moduleSettings: sanitizeModuleSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalModuleSettings = async (req, res, next) => {
  try {
    let settings = await ModuleSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await ModuleSettings.create({
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
      entity: "module_settings",
      entityId: settings._id,
      message: "Global module settings updated",
    });

    res.json({
      message: "Global module settings updated successfully",
      moduleSettings: sanitizeModuleSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteModuleSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await ModuleSettings.findOne({ instituteId });
    
    if (!settings) {
      // Fallback to global settings
      const globalSettings = await ModuleSettings.findOne({ instituteId: null });
      settings = globalSettings || new ModuleSettings();
    }
    
    res.json({
      moduleSettings: sanitizeModuleSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstituteModuleSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await ModuleSettings.findOne({ instituteId });
    
    if (!settings) {
      settings = await ModuleSettings.create({
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
      entity: "module_settings",
      entityId: settings._id,
      message: "Institute module settings updated",
    });

    res.json({
      message: "Institute module settings updated successfully",
      moduleSettings: sanitizeModuleSettings(settings),
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

    const globalSettings = await ModuleSettings.findOne({ instituteId: null });
    if (!globalSettings) {
      res.status(404);
      throw new Error("Global module settings not found");
    }

    let settings = await ModuleSettings.findOne({ instituteId });
    
    if (settings) {
      // Copy global settings to institute settings
      Object.assign(settings, globalSettings.toObject());
      settings.instituteId = instituteId;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      // Create new institute settings from global
      settings = await ModuleSettings.create({
        instituteId,
        ...globalSettings.toObject(),
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId,
      action: "reset",
      entity: "module_settings",
      entityId: settings._id,
      message: "Institute module settings reset to global defaults",
    });

    res.json({
      message: "Institute module settings reset to global defaults successfully",
      moduleSettings: sanitizeModuleSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export {
  getGlobalModuleSettings,
  updateGlobalModuleSettings,
  getInstituteModuleSettings,
  updateInstituteModuleSettings,
  resetToGlobal,
};
