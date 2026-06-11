import FormSettings from "../models/FormSettings.js";
import createAuditLog from "../utils/audit.js";
import { getScopedInstituteId } from "../utils/scope.js";

const sanitizeFormSettings = (settings) => ({
  _id: settings._id,
  instituteId: settings.instituteId,
  entity: settings.entity,
  fields: settings.fields,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const getGlobalFormSettings = async (req, res, next) => {
  try {
    const { entity } = req.params;
    
    let settings = await FormSettings.findOne({ instituteId: null, entity });
    
    if (!settings) {
      // Create default form settings for this entity
      const defaultFields = getDefaultFieldsForEntity(entity);
      settings = await FormSettings.create({
        instituteId: null,
        entity,
        fields: defaultFields,
      });
    }
    
    res.json({
      formSettings: sanitizeFormSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalFormSettings = async (req, res, next) => {
  try {
    const { entity } = req.params;
    
    let settings = await FormSettings.findOne({ instituteId: null, entity });
    
    if (!settings) {
      settings = await FormSettings.create({
        instituteId: null,
        entity,
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
      entity: "form_settings",
      entityId: settings._id,
      message: `Global form settings updated for ${entity}`,
    });

    res.json({
      message: `Global form settings for ${entity} updated successfully`,
      formSettings: sanitizeFormSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteFormSettings = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await FormSettings.findOne({ instituteId, entity });
    
    if (!settings) {
      // Fallback to global settings
      const globalSettings = await FormSettings.findOne({ instituteId: null, entity });
      if (globalSettings) {
        settings = globalSettings;
      } else {
        // Create default form settings
        const defaultFields = getDefaultFieldsForEntity(entity);
        settings = new FormSettings({ instituteId: null, entity, fields: defaultFields });
      }
    }
    
    res.json({
      formSettings: sanitizeFormSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstituteFormSettings = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    let settings = await FormSettings.findOne({ instituteId, entity });
    
    if (!settings) {
      settings = await FormSettings.create({
        instituteId,
        entity,
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
      entity: "form_settings",
      entityId: settings._id,
      message: `Institute form settings updated for ${entity}`,
    });

    res.json({
      message: `Institute form settings for ${entity} updated successfully`,
      formSettings: sanitizeFormSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const resetToGlobal = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute scope not found for this request");
    }

    const globalSettings = await FormSettings.findOne({ instituteId: null, entity });
    if (!globalSettings) {
      res.status(404);
      throw new Error("Global form settings not found for this entity");
    }

    let settings = await FormSettings.findOne({ instituteId, entity });
    
    if (settings) {
      // Copy global settings to institute settings
      Object.assign(settings, globalSettings.toObject());
      settings.instituteId = instituteId;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      // Create new institute settings from global
      settings = await FormSettings.create({
        instituteId,
        ...globalSettings.toObject(),
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId,
      action: "reset",
      entity: "form_settings",
      entityId: settings._id,
      message: `Institute form settings for ${entity} reset to global defaults`,
    });

    res.json({
      message: `Institute form settings for ${entity} reset to global defaults successfully`,
      formSettings: sanitizeFormSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getDefaultFieldsForEntity = (entity) => {
  const defaults = {
    student: [
      { fieldKey: "name", label: "Name", type: "text", required: true, showInForm: true, showInList: true, order: 1 },
      { fieldKey: "email", label: "Email", type: "email", required: true, showInForm: true, showInList: true, order: 2 },
      { fieldKey: "phone", label: "Phone", type: "phone", required: false, showInForm: true, showInList: true, order: 3 },
      { fieldKey: "password", label: "Password", type: "text", required: true, showInForm: true, showInList: false, order: 4, autoGenerate: true },
      { fieldKey: "academicGroupId", label: "Academic Group", type: "select", required: true, showInForm: true, showInList: true, order: 5 },
      { fieldKey: "rollNumber", label: "Roll Number", type: "text", required: true, showInForm: true, showInList: true, order: 6, autoGenerate: true },
      { fieldKey: "admissionNumber", label: "Admission Number", type: "text", required: true, showInForm: true, showInList: true, order: 7, autoGenerate: true },
      { fieldKey: "registrationNumber", label: "Registration Number", type: "text", required: false, showInForm: true, showInList: true, order: 8, autoGenerate: true },
      { fieldKey: "dob", label: "Date of Birth", type: "date", required: false, showInForm: true, showInList: false, order: 9 },
      { fieldKey: "gender", label: "Gender", type: "select", required: false, showInForm: true, showInList: false, order: 10, options: ["male", "female", "other"] },
      { fieldKey: "bloodGroup", label: "Blood Group", type: "text", required: false, showInForm: true, showInList: false, order: 11 },
      { fieldKey: "address", label: "Address", type: "textarea", required: false, showInForm: true, showInList: false, order: 12 },
      { fieldKey: "admissionDate", label: "Admission Date", type: "date", required: false, showInForm: true, showInList: false, order: 13, defaultValue: new Date() },
      { fieldKey: "status", label: "Status", type: "select", required: true, showInForm: true, showInList: true, order: 14, options: ["active", "inactive"], defaultValue: "active" },
    ],
    teacher: [
      { fieldKey: "name", label: "Name", type: "text", required: true, showInForm: true, showInList: true, order: 1 },
      { fieldKey: "email", label: "Email", type: "email", required: true, showInForm: true, showInList: true, order: 2 },
      { fieldKey: "phone", label: "Phone", type: "phone", required: false, showInForm: true, showInList: true, order: 3 },
      { fieldKey: "password", label: "Password", type: "text", required: true, showInForm: true, showInList: false, order: 4 },
      { fieldKey: "designation", label: "Designation", type: "text", required: false, showInForm: true, showInList: true, order: 5 },
      { fieldKey: "qualification", label: "Qualification", type: "text", required: false, showInForm: true, showInList: false, order: 6 },
      { fieldKey: "address", label: "Address", type: "textarea", required: false, showInForm: true, showInList: false, order: 7 },
      { fieldKey: "status", label: "Status", type: "select", required: true, showInForm: true, showInList: true, order: 8, options: ["active", "inactive"], defaultValue: "active" },
    ],
    parent: [
      { fieldKey: "name", label: "Name", type: "text", required: true, showInForm: true, showInList: true, order: 1 },
      { fieldKey: "email", label: "Email", type: "email", required: true, showInForm: true, showInList: true, order: 2 },
      { fieldKey: "phone", label: "Phone", type: "phone", required: false, showInForm: true, showInList: true, order: 3 },
      { fieldKey: "password", label: "Password", type: "text", required: true, showInForm: true, showInList: false, order: 4 },
      { fieldKey: "address", label: "Address", type: "textarea", required: false, showInForm: true, showInList: false, order: 5 },
      { fieldKey: "status", label: "Status", type: "select", required: true, showInForm: true, showInList: true, order: 6, options: ["active", "inactive"], defaultValue: "active" },
    ],
    staff: [
      { fieldKey: "name", label: "Name", type: "text", required: true, showInForm: true, showInList: true, order: 1 },
      { fieldKey: "email", label: "Email", type: "email", required: true, showInForm: true, showInList: true, order: 2 },
      { fieldKey: "phone", label: "Phone", type: "phone", required: false, showInForm: true, showInList: true, order: 3 },
      { fieldKey: "password", label: "Password", type: "text", required: true, showInForm: true, showInList: false, order: 4 },
      { fieldKey: "designation", label: "Designation", type: "text", required: false, showInForm: true, showInList: true, order: 5 },
      { fieldKey: "department", label: "Department", type: "text", required: false, showInForm: true, showInList: true, order: 6 },
      { fieldKey: "address", label: "Address", type: "textarea", required: false, showInForm: true, showInList: false, order: 7 },
      { fieldKey: "status", label: "Status", type: "select", required: true, showInForm: true, showInList: true, order: 8, options: ["active", "inactive"], defaultValue: "active" },
    ],
  };

  return defaults[entity] || [];
};

export {
  getGlobalFormSettings,
  updateGlobalFormSettings,
  getInstituteFormSettings,
  updateInstituteFormSettings,
  resetToGlobal,
};
