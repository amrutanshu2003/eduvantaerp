import LabelSettings from "../models/LabelSettings.js";
import createAuditLog from "../utils/audit.js";
import { getScopedInstituteId } from "../utils/scope.js";

const sanitizeLabelSettings = (settings) => ({
  _id: settings._id,
  instituteId: settings.instituteId,
  labels: settings.labels,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const getGlobalLabelSettings = async (req, res, next) => {
  try {
    let settings = await LabelSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await LabelSettings.create({ instituteId: null });
    }
    
    res.json({
      labelSettings: sanitizeLabelSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalLabelSettings = async (req, res, next) => {
  try {
    let settings = await LabelSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await LabelSettings.create({
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
      entity: "label_settings",
      entityId: settings._id,
      message: "Global label settings updated",
    });

    res.json({
      message: "Global label settings updated successfully",
      labelSettings: sanitizeLabelSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteLabelSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await LabelSettings.findOne({ instituteId });
    
    if (!settings) {
      // Fallback to global settings
      const globalSettings = await LabelSettings.findOne({ instituteId: null });
      settings = globalSettings || new LabelSettings();
    }
    
    res.json({
      labelSettings: sanitizeLabelSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstituteLabelSettings = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await LabelSettings.findOne({ instituteId });
    
    if (!settings) {
      settings = await LabelSettings.create({
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
      entity: "label_settings",
      entityId: settings._id,
      message: "Institute label settings updated",
    });

    res.json({
      message: "Institute label settings updated successfully",
      labelSettings: sanitizeLabelSettings(settings),
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

    const globalSettings = await LabelSettings.findOne({ instituteId: null });
    if (!globalSettings) {
      res.status(404);
      throw new Error("Global label settings not found");
    }

    let settings = await LabelSettings.findOne({ instituteId });
    
    if (settings) {
      // Copy global settings to institute settings
      Object.assign(settings, globalSettings.toObject());
      settings.instituteId = instituteId;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      // Create new institute settings from global
      settings = await LabelSettings.create({
        instituteId,
        ...globalSettings.toObject(),
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId,
      action: "reset",
      entity: "label_settings",
      entityId: settings._id,
      message: "Institute label settings reset to global defaults",
    });

    res.json({
      message: "Institute label settings reset to global defaults successfully",
      labelSettings: sanitizeLabelSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export {
  getGlobalLabelSettings,
  updateGlobalLabelSettings,
  getInstituteLabelSettings,
  updateInstituteLabelSettings,
  resetToGlobal,
};
