import AcademicGroup from "../models/AcademicGroup.js";
import Institute from "../models/Institute.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const groupSelect =
  "instituteId instituteType schoolLevel className programLevel department course semester year batch section mentorOrClassTeacher status createdBy isDeleted createdAt updatedAt";

const sanitizeAcademicGroup = (group) => ({
  _id: group._id,
  instituteId: group.instituteId,
  instituteType: group.instituteType,
  schoolLevel: group.schoolLevel,
  className: group.className,
  programLevel: group.programLevel,
  department: group.department,
  course: group.course,
  semester: group.semester,
  year: group.year,
  batch: group.batch,
  section: group.section,
  mentorOrClassTeacher: group.mentorOrClassTeacher,
  status: group.status,
  createdBy: group.createdBy,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
});

const validateAcademicGroup = (payload, instituteType) => {
  if (!["active", "inactive"].includes(payload.status || "active")) {
    return "Status must be active or inactive";
  }

  if (instituteType === "school") {
    if (!payload.schoolLevel || !payload.className || !payload.section) {
      return "School academic group requires school level, class name, and section";
    }
  }

  if (instituteType === "college" || instituteType === "university") {
    if (!payload.programLevel || !payload.department || !payload.course || !payload.section) {
      return `${instituteType === "college" ? "College" : "University"} academic group requires program level, department, course, and section`;
    }
  }

  return null;
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

const createAcademicGroup = async (req, res, next) => {
  try {
    const institute = await getInstituteForRequest(req);
    const validationError = validateAcademicGroup(req.body, institute.instituteType);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const payload = { ...req.body };
    if (payload.schoolLevel === "") payload.schoolLevel = null;
    if (payload.programLevel === "") payload.programLevel = null;

    const group = await AcademicGroup.create({
      ...payload,
      instituteId: institute._id,
      instituteType: institute.instituteType,
      createdBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId: institute._id,
      action: "create",
      entity: "academic_group",
      entityId: group._id,
      message: "Academic group created",
    });

    res.status(201).json({
      message: "Academic group created successfully",
      academicGroup: sanitizeAcademicGroup(group),
    });
  } catch (error) {
    next(error);
  }
};

const getAcademicGroups = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = {
      isDeleted: false,
    };

    if (instituteId) {
      query.instituteId = instituteId;
    }

    if (req.user?.role === "teacher") {
      const assignedGroups = (req.user.assignedAcademicGroups || []).map((value) => value._id || value);
      if (assignedGroups.length > 0) {
        query._id = { $in: assignedGroups };
      }
    }

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    const groups = await AcademicGroup.find(query)
      .select(groupSelect)
      .populate("mentorOrClassTeacher", "name email")
      .sort({ createdAt: -1 });

    res.json({
      academicGroups: groups.map(sanitizeAcademicGroup),
    });
  } catch (error) {
    next(error);
  }
};

const getAcademicGroupById = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findOne({ _id: req.params.id, isDeleted: false })
      .select(groupSelect)
      .populate("mentorOrClassTeacher", "name email")
      .populate("instituteId", "name instituteType");

    if (!group) {
      res.status(404);
      throw new Error("Academic group not found");
    }

    if (!ensureInstituteScope(req, group.instituteId?._id || group.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }

    res.json({
      academicGroup: sanitizeAcademicGroup(group),
    });
  } catch (error) {
    next(error);
  }
};

const updateAcademicGroup = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findOne({ _id: req.params.id, isDeleted: false });

    if (!group) {
      res.status(404);
      throw new Error("Academic group not found");
    }

    if (!ensureInstituteScope(req, group.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }

    const validationError = validateAcademicGroup(
      { ...group.toObject(), ...req.body },
      group.instituteType
    );

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const payload = { ...req.body };
    if (payload.schoolLevel === "") payload.schoolLevel = null;
    if (payload.programLevel === "") payload.programLevel = null;

    Object.assign(group, payload);
    await group.save();

    await createAuditLog({
      req,
      instituteId: group.instituteId,
      action: "update",
      entity: "academic_group",
      entityId: group._id,
      message: "Academic group updated",
    });

    res.json({
      message: "Academic group updated successfully",
      academicGroup: sanitizeAcademicGroup(group),
    });
  } catch (error) {
    next(error);
  }
};

const updateAcademicGroupStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const group = await AcademicGroup.findOne({ _id: req.params.id, isDeleted: false });
    if (!group) {
      res.status(404);
      throw new Error("Academic group not found");
    }

    if (!ensureInstituteScope(req, group.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }

    group.status = status;
    await group.save();

    await createAuditLog({
      req,
      instituteId: group.instituteId,
      action: "status_update",
      entity: "academic_group",
      entityId: group._id,
      message: `Academic group marked ${status}`,
    });

    res.json({
      message: "Academic group status updated successfully",
      academicGroup: sanitizeAcademicGroup(group),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAcademicGroup = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findOne({ _id: req.params.id, isDeleted: false });
    if (!group) {
      res.status(404);
      throw new Error("Academic group not found");
    }

    if (!ensureInstituteScope(req, group.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }

    group.isDeleted = true;
    group.deletedAt = new Date();
    group.status = "inactive";
    await group.save();

    await createAuditLog({
      req,
      instituteId: group.instituteId,
      action: "soft_delete",
      entity: "academic_group",
      entityId: group._id,
      message: "Academic group deleted",
    });

    res.json({ message: "Academic group deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createAcademicGroup,
  getAcademicGroups,
  getAcademicGroupById,
  updateAcademicGroup,
  updateAcademicGroupStatus,
  deleteAcademicGroup,
};
