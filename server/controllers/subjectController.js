import AcademicGroup from "../models/AcademicGroup.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const sanitizeSubject = (subject) => ({
  _id: subject._id,
  instituteId: subject.instituteId,
  academicGroupId: subject.academicGroupId,
  subjectName: subject.subjectName,
  subjectCode: subject.subjectCode,
  subjectType: subject.subjectType,
  teacherId: subject.teacherId,
  totalMarks: subject.totalMarks,
  passingMarks: subject.passingMarks,
  status: subject.status,
  createdBy: subject.createdBy,
  createdAt: subject.createdAt,
  updatedAt: subject.updatedAt,
});

const validateSubject = async (req, payload, subjectId = null) => {
  if (!payload.subjectName?.trim() || !payload.subjectCode?.trim() || !payload.academicGroupId) {
    return "Subject name, subject code, and academic group are required";
  }

  const instituteId = getScopedInstituteId(req, true);
  const academicGroup = await AcademicGroup.findOne({
    _id: payload.academicGroupId,
    instituteId,
    isDeleted: false,
  });

  if (!academicGroup) {
    return "Academic group not found for this institute";
  }

  const duplicate = await Subject.findOne({
    _id: { $ne: subjectId },
    instituteId,
    subjectCode: payload.subjectCode.trim().toUpperCase(),
    isDeleted: false,
  });

  if (duplicate) {
    return "Subject code already exists in this institute";
  }

  if (payload.teacherId) {
    const teacher = await Teacher.findOne({
      _id: payload.teacherId,
      instituteId,
      isDeleted: false,
    });
    if (!teacher) {
      return "Teacher not found for this institute";
    }
  }

  return null;
};

const createSubject = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const validationError = await validateSubject(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const subject = await Subject.create({
      ...req.body,
      instituteId,
      subjectCode: req.body.subjectCode.trim().toUpperCase(),
      createdBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "subject",
      entityId: subject._id,
      message: "Subject created",
    });

    res.status(201).json({ message: "Subject created successfully", subject: sanitizeSubject(subject) });
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = { instituteId, isDeleted: false };

    if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
      query.academicGroupId = req.query.academicGroupId;
    }
    if (req.query.teacherId && req.query.teacherId !== "all") {
      query.teacherId = req.query.teacherId;
    }
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }
    if (req.user?.role === "teacher") {
      query.teacherId = req.user._id;
    }

    const subjects = await Subject.find(query)
      .populate("academicGroupId", "className section department course semester year")
      .populate("teacherId", "name email department")
      .sort({ createdAt: -1 });

    res.json({ subjects: subjects.map(sanitizeSubject) });
  } catch (error) {
    next(error);
  }
};

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false })
      .populate("academicGroupId", "className section department course semester year")
      .populate("teacherId", "name email department");

    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    if (!ensureInstituteScope(req, subject.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }
    if (req.user?.role === "teacher" && String(subject.teacherId?._id || subject.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }

    res.json({ subject: sanitizeSubject(subject) });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    if (!ensureInstituteScope(req, subject.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }

    const validationError = await validateSubject(req, { ...subject.toObject(), ...req.body }, subject._id);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    Object.assign(subject, {
      subjectName: req.body.subjectName?.trim() ?? subject.subjectName,
      subjectCode: req.body.subjectCode?.trim().toUpperCase() ?? subject.subjectCode,
      academicGroupId: req.body.academicGroupId ?? subject.academicGroupId,
      subjectType: req.body.subjectType ?? subject.subjectType,
      teacherId: req.body.teacherId ?? subject.teacherId,
      totalMarks: req.body.totalMarks ?? subject.totalMarks,
      passingMarks: req.body.passingMarks ?? subject.passingMarks,
      status: req.body.status ?? subject.status,
    });

    await subject.save();

    await createAuditLog({
      req,
      instituteId: subject.instituteId,
      action: "update",
      entity: "subject",
      entityId: subject._id,
      message: "Subject updated",
    });

    res.json({ message: "Subject updated successfully", subject: sanitizeSubject(subject) });
  } catch (error) {
    next(error);
  }
};

const updateSubjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    if (!ensureInstituteScope(req, subject.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }

    subject.status = status;
    await subject.save();
    await createAuditLog({
      req,
      instituteId: subject.instituteId,
      action: "status_update",
      entity: "subject",
      entityId: subject._id,
      message: `Subject marked ${status}`,
    });

    res.json({ message: "Subject status updated successfully", subject: sanitizeSubject(subject) });
  } catch (error) {
    next(error);
  }
};

const assignTeacherToSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    if (!ensureInstituteScope(req, subject.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }

    const teacher = await Teacher.findOne({
      _id: req.body.teacherId,
      instituteId: subject.instituteId,
      isDeleted: false,
    });
    if (!teacher) {
      res.status(400);
      throw new Error("Teacher not found for this institute");
    }

    subject.teacherId = teacher._id;
    await subject.save();
    await createAuditLog({
      req,
      instituteId: subject.instituteId,
      action: "assign_teacher",
      entity: "subject",
      entityId: subject._id,
      message: "Teacher assigned to subject",
    });

    res.json({ message: "Teacher assigned successfully", subject: sanitizeSubject(subject) });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    if (!ensureInstituteScope(req, subject.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this subject");
    }

    subject.isDeleted = true;
    subject.deletedAt = new Date();
    subject.status = "inactive";
    await subject.save();
    await createAuditLog({
      req,
      instituteId: subject.instituteId,
      action: "soft_delete",
      entity: "subject",
      entityId: subject._id,
      message: "Subject deleted",
    });

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  updateSubjectStatus,
  assignTeacherToSubject,
  deleteSubject,
};
