import AcademicGroup from "../models/AcademicGroup.js";
import User from "../models/User.js";
import createAuditLog from "../utils/audit.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const buildTeacherQuery = (req) => {
  const query = {
    role: "teacher",
    isDeleted: false,
  };

  const instituteId = getScopedInstituteId(req, true);
  if (instituteId) {
    query.instituteId = instituteId;
  }

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    query.$or = [
      { name: { $regex: req.query.search.trim(), $options: "i" } },
      { email: { $regex: req.query.search.trim(), $options: "i" } },
      { employeeId: { $regex: req.query.search.trim(), $options: "i" } },
      { department: { $regex: req.query.search.trim(), $options: "i" } },
    ];
  }

  return query;
};

const validateTeacherPayload = ({ name, email, password }, isCreate) => {
  if (!name?.trim() || !email?.trim()) {
    return "Name and email are required";
  }

  if (isCreate && !password?.trim()) {
    return "Password is required";
  }

  return null;
};

const createTeacher = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const validationError = validateTeacherPayload(req.body, true);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const existingUser = await User.findOne({
      email: req.body.email.trim().toLowerCase(),
      isDeleted: false,
    });

    if (existingUser) {
      res.status(409);
      throw new Error("User with this email already exists");
    }

    const teacher = await User.create({
      ...req.body,
      email: req.body.email.trim().toLowerCase(),
      role: "teacher",
      instituteId,
      createdBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "teacher",
      entityId: teacher._id,
      message: "Teacher created",
    });

    res.status(201).json({
      message: "Teacher created successfully",
      teacher: serializeUser(teacher),
    });
  } catch (error) {
    next(error);
  }
};

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find(buildTeacherQuery(req))
      .select("-password")
      .populate("assignedAcademicGroups", "className section department course semester year")
      .sort({ createdAt: -1 });

    res.json({
      teachers: teachers.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isDeleted: false,
    })
      .select("-password")
      .populate("assignedAcademicGroups", "className section department course semester year");

    if (!teacher) {
      res.status(404);
      throw new Error("Teacher not found");
    }

    if (!ensureInstituteScope(req, teacher.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this teacher");
    }

    res.json({ teacher: serializeUser(teacher) });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isDeleted: false,
    }).select("+password");

    if (!teacher) {
      res.status(404);
      throw new Error("Teacher not found");
    }

    if (!ensureInstituteScope(req, teacher.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this teacher");
    }

    const validationError = validateTeacherPayload({ ...teacher.toObject(), ...req.body }, false);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    if (req.body.email && req.body.email.trim().toLowerCase() !== teacher.email) {
      const duplicateUser = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
        isDeleted: false,
        _id: { $ne: teacher._id },
      });

      if (duplicateUser) {
        res.status(409);
        throw new Error("User with this email already exists");
      }
    }

    Object.assign(teacher, {
      name: req.body.name?.trim() ?? teacher.name,
      email: req.body.email?.trim().toLowerCase() ?? teacher.email,
      phone: req.body.phone?.trim() ?? teacher.phone,
      employeeId: req.body.employeeId?.trim() ?? teacher.employeeId,
      qualification: req.body.qualification?.trim() ?? teacher.qualification,
      experience: req.body.experience?.trim() ?? teacher.experience,
      department: req.body.department?.trim() ?? teacher.department,
      status: req.body.status ?? teacher.status,
      profilePhoto: req.body.profilePhoto?.trim() ?? teacher.profilePhoto,
    });

    if (req.body.password?.trim()) {
      teacher.password = req.body.password.trim();
    }

    await teacher.save();

    await createAuditLog({
      req,
      instituteId: teacher.instituteId,
      action: "update",
      entity: "teacher",
      entityId: teacher._id,
      message: "Teacher updated",
    });

    res.json({
      message: "Teacher updated successfully",
      teacher: serializeUser(teacher),
    });
  } catch (error) {
    next(error);
  }
};

const updateTeacherStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isDeleted: false,
    });

    if (!teacher) {
      res.status(404);
      throw new Error("Teacher not found");
    }

    if (!ensureInstituteScope(req, teacher.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this teacher");
    }

    teacher.status = status;
    await teacher.save();

    await createAuditLog({
      req,
      instituteId: teacher.instituteId,
      action: "status_update",
      entity: "teacher",
      entityId: teacher._id,
      message: `Teacher marked ${status}`,
    });

    res.json({ message: "Teacher status updated successfully", teacher: serializeUser(teacher) });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isDeleted: false,
    });

    if (!teacher) {
      res.status(404);
      throw new Error("Teacher not found");
    }

    if (!ensureInstituteScope(req, teacher.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this teacher");
    }

    teacher.isDeleted = true;
    teacher.deletedAt = new Date();
    teacher.status = "inactive";
    await teacher.save();

    await createAuditLog({
      req,
      instituteId: teacher.instituteId,
      action: "soft_delete",
      entity: "teacher",
      entityId: teacher._id,
      message: "Teacher deleted",
    });

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const assignAcademicGroupsToTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isDeleted: false,
    });

    if (!teacher) {
      res.status(404);
      throw new Error("Teacher not found");
    }

    if (!ensureInstituteScope(req, teacher.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this teacher");
    }

    const academicGroupIds = Array.isArray(req.body.academicGroupIds) ? req.body.academicGroupIds : [];

    const groups = await AcademicGroup.find({
      _id: { $in: academicGroupIds },
      instituteId: teacher.instituteId,
      isDeleted: false,
    });

    if (groups.length !== academicGroupIds.length) {
      res.status(400);
      throw new Error("One or more academic groups are invalid for this institute");
    }

    teacher.assignedAcademicGroups = academicGroupIds;
    await teacher.save();

    await createAuditLog({
      req,
      instituteId: teacher.instituteId,
      action: "assign_academic_groups",
      entity: "teacher",
      entityId: teacher._id,
      message: "Academic groups assigned to teacher",
    });

    res.json({
      message: "Academic groups assigned successfully",
      teacher: serializeUser(teacher),
    });
  } catch (error) {
    next(error);
  }
};

export {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  deleteTeacher,
  assignAcademicGroupsToTeacher,
};
