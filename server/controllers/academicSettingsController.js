import AcademicSettings from "../models/AcademicSettings.js";
import Institute from "../models/Institute.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const templates = {
  school: {
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
    studentLabel: "Student",
    levels: [
      { name: "Pre-Primary", order: 1, status: "active" },
      { name: "Primary", order: 2, status: "active" },
      { name: "Middle", order: 3, status: "active" },
      { name: "Secondary", order: 4, status: "active" },
      { name: "Higher Secondary", order: 5, status: "active" },
    ],
    fields: [
      { fieldKey: "schoolLevel", label: "School Level", type: "select", required: true, options: ["Pre-Primary", "Primary", "Middle", "Secondary", "Higher Secondary"], showInList: true, order: 1, status: "active" },
      { fieldKey: "className", label: "Class Name", type: "text", required: true, showInList: true, order: 2, status: "active" },
      { fieldKey: "section", label: "Section", type: "text", required: true, showInList: true, order: 3, status: "active" },
    ],
  },
  college: {
    academicGroupLabel: "Semester",
    subGroupLabel: "Batch",
    teacherLabel: "Faculty",
    parentLabel: "Guardian",
    studentLabel: "Student",
    levels: [
      { name: "UG", order: 1, status: "active" },
      { name: "PG", order: 2, status: "active" },
      { name: "Diploma", order: 3, status: "active" },
      { name: "Certificate", order: 4, status: "active" },
    ],
    fields: [
      { fieldKey: "programLevel", label: "Program Level", type: "select", required: true, options: ["UG", "PG", "Diploma", "Certificate"], showInList: true, order: 1, status: "active" },
      { fieldKey: "department", label: "Department", type: "text", required: true, showInList: true, order: 2, status: "active" },
      { fieldKey: "course", label: "Course", type: "text", required: true, showInList: true, order: 3, status: "active" },
      { fieldKey: "semester", label: "Semester", type: "text", required: false, showInList: true, order: 4, status: "active" },
      { fieldKey: "year", label: "Year", type: "text", required: false, showInList: false, order: 5, status: "active" },
      { fieldKey: "batch", label: "Batch", type: "text", required: false, showInList: true, order: 6, status: "active" },
      { fieldKey: "section", label: "Section", type: "text", required: true, showInList: true, order: 7, status: "active" },
    ],
  },
  university: {
    academicGroupLabel: "Program",
    subGroupLabel: "Batch",
    teacherLabel: "Faculty",
    parentLabel: "Guardian",
    studentLabel: "Student / Research Scholar",
    levels: [
      { name: "UG", order: 1, status: "active" },
      { name: "PG", order: 2, status: "active" },
      { name: "PhD", order: 3, status: "active" },
      { name: "Diploma", order: 4, status: "active" },
      { name: "Certificate", order: 5, status: "active" },
    ],
    fields: [
      { fieldKey: "facultyName", label: "Faculty Name", type: "text", required: true, showInList: true, order: 1, status: "active" },
      { fieldKey: "department", label: "Department", type: "text", required: true, showInList: true, order: 2, status: "active" },
      { fieldKey: "programLevel", label: "Program Level", type: "select", required: true, options: ["UG", "PG", "PhD", "Diploma", "Certificate"], showInList: true, order: 3, status: "active" },
      { fieldKey: "course", label: "Course", type: "text", required: true, showInList: true, order: 4, status: "active" },
      { fieldKey: "semester", label: "Semester", type: "text", required: false, showInList: true, order: 5, status: "active" },
      { fieldKey: "year", label: "Year", type: "text", required: false, showInList: false, order: 6, status: "active" },
      { fieldKey: "batch", label: "Batch", type: "text", required: false, showInList: true, order: 7, status: "active" },
      { fieldKey: "section", label: "Section", type: "text", required: true, showInList: true, order: 8, status: "active" },
      { fieldKey: "supervisor", label: "Supervisor", type: "text", required: false, showInList: false, order: 9, status: "active" },
    ],
  },
  minimal: {
    academicGroupLabel: "Group",
    subGroupLabel: "Sub-group",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
    studentLabel: "Student",
    levels: [
      { name: "Level 1", order: 1, status: "active" },
      { name: "Level 2", order: 2, status: "active" },
      { name: "Level 3", order: 3, status: "active" },
    ],
    fields: [
      { fieldKey: "name", label: "Name", type: "text", required: true, showInList: true, order: 1, status: "active" },
      { fieldKey: "level", label: "Level", type: "select", required: true, options: ["Level 1", "Level 2", "Level 3"], showInList: true, order: 2, status: "active" },
      { fieldKey: "description", label: "Description", type: "textarea", required: false, showInList: false, order: 3, status: "active" },
    ],
  },
};

const sanitizeAcademicSettings = (settings) => ({
  _id: settings._id,
  instituteId: settings.instituteId,
  academicGroupLabel: settings.academicGroupLabel,
  subGroupLabel: settings.subGroupLabel,
  teacherLabel: settings.teacherLabel,
  parentLabel: settings.parentLabel,
  studentLabel: settings.studentLabel,
  levels: settings.levels,
  fields: settings.fields,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const getGlobalAcademicSettings = async (req, res, next) => {
  try {
    let settings = await AcademicSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await AcademicSettings.create({ instituteId: null });
    }
    
    res.json({
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalAcademicSettings = async (req, res, next) => {
  try {
    let settings = await AcademicSettings.findOne({ instituteId: null });
    
    if (!settings) {
      settings = await AcademicSettings.create({
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
      entity: "academic_settings",
      entityId: settings._id,
      message: "Global academic settings updated",
    });

    res.json({
      message: "Global academic settings updated successfully",
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const resetGlobalTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    
    if (!template || !templates[template]) {
      res.status(400);
      throw new Error("Invalid template. Use: school, college, university, minimal");
    }

    let settings = await AcademicSettings.findOne({ instituteId: null });
    const templateData = templates[template];
    
    if (settings) {
      Object.assign(settings, templateData);
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      settings = await AcademicSettings.create({
        instituteId: null,
        ...templateData,
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId: null,
      action: "reset_template",
      entity: "academic_settings",
      entityId: settings._id,
      message: `Global academic settings reset to ${template} template`,
    });

    res.json({
      message: `Global academic settings reset to ${template} template successfully`,
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteForRequest = async (req) => {
  const instituteId = getScopedInstituteId(req, true);
  if (!instituteId) {
    throw new Error("Institute scope not found for this request");
  }

  const institute = await Institute.findById(instituteId);
  if (!institute || institute.isDeleted) {
    throw new Error("Institute not found");
  }

  return institute;
};

const getOrCreateDefaultSettings = async (instituteId, instituteType) => {
  let settings = await AcademicSettings.findOne({ instituteId });
  
  if (!settings) {
    const template = templates[instituteType] || templates.school;
    settings = await AcademicSettings.create({
      instituteId,
      ...template,
    });
  }
  
  return settings;
};

const getAcademicSettings = async (req, res, next) => {
  try {
    const institute = await getInstituteForRequest(req);
    let settings = await AcademicSettings.findOne({ instituteId: institute._id });
    
    if (!settings) {
      // Fallback to global settings
      const globalSettings = await AcademicSettings.findOne({ instituteId: null });
      if (globalSettings) {
        settings = globalSettings;
      } else {
        // Create default based on institute type
        const template = templates[institute.instituteType] || templates.school;
        settings = await AcademicSettings.create({
          instituteId: institute._id,
          ...template,
        });
      }
    }
    
    res.json({
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateAcademicSettings = async (req, res, next) => {
  try {
    const institute = await getInstituteForRequest(req);
    let settings = await AcademicSettings.findOne({ instituteId: institute._id });
    
    if (!settings) {
      settings = await AcademicSettings.create({
        instituteId: institute._id,
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
      instituteId: institute._id,
      action: "update",
      entity: "academic_settings",
      entityId: settings._id,
      message: "Academic settings updated",
    });

    res.json({
      message: "Academic settings updated successfully",
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const resetTemplate = async (req, res, next) => {
  try {
    const { template } = req.body;
    
    if (!template || !templates[template]) {
      res.status(400);
      throw new Error("Invalid template. Use: school, college, university, minimal");
    }

    const institute = await getInstituteForRequest(req);
    let settings = await AcademicSettings.findOne({ instituteId: institute._id });
    
    const templateData = templates[template];
    
    if (settings) {
      Object.assign(settings, templateData);
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      settings = await AcademicSettings.create({
        instituteId: institute._id,
        ...templateData,
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId: institute._id,
      action: "reset_template",
      entity: "academic_settings",
      entityId: settings._id,
      message: `Academic settings reset to ${template} template`,
    });

    res.json({
      message: `Academic settings reset to ${template} template successfully`,
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const resetToGlobal = async (req, res, next) => {
  try {
    const institute = await getInstituteForRequest(req);
    const globalSettings = await AcademicSettings.findOne({ instituteId: null });
    if (!globalSettings) {
      res.status(404);
      throw new Error("Global academic settings not found");
    }

    let settings = await AcademicSettings.findOne({ instituteId: institute._id });
    
    if (settings) {
      // Copy global settings to institute settings
      Object.assign(settings, globalSettings.toObject());
      settings.instituteId = institute._id;
      settings.updatedBy = req.user._id;
      await settings.save();
    } else {
      // Create new institute settings from global
      settings = await AcademicSettings.create({
        instituteId: institute._id,
        ...globalSettings.toObject(),
        createdBy: req.user._id,
      });
    }

    await createAuditLog({
      req,
      instituteId: institute._id,
      action: "reset",
      entity: "academic_settings",
      entityId: settings._id,
      message: "Institute academic settings reset to global defaults",
    });

    res.json({
      message: "Institute academic settings reset to global defaults successfully",
      academicSettings: sanitizeAcademicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export {
  getGlobalAcademicSettings,
  updateGlobalAcademicSettings,
  resetGlobalTemplate,
  getAcademicSettings,
  updateAcademicSettings,
  resetTemplate,
  resetToGlobal,
};
