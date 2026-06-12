import AcademicGroup from "../models/AcademicGroup.js";
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { ensureTeacherAcademicGroupAccess } from "../utils/roleAccess.js";
import { createNotification, getUserIdsByRole, getParentUserIdsForStudent } from "../utils/notificationUtils.js";

const sanitizeExam = (exam) => ({
  _id: exam._id,
  instituteId: exam.instituteId,
  academicGroupId: exam.academicGroupId,
  examName: exam.examName,
  examType: exam.examType,
  startDate: exam.startDate,
  endDate: exam.endDate,
  status: exam.status,
  createdBy: exam.createdBy,
  createdAt: exam.createdAt,
  updatedAt: exam.updatedAt,
});

const validateExam = async (req, payload) => {
  if (!payload.examName?.trim() || !payload.examType || !payload.academicGroupId || !payload.startDate || !payload.endDate) {
    return "Exam name, type, academic group, start date, and end date are required";
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
  return null;
};

const createExam = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const validationError = await validateExam(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }
    const exam = await Exam.create({
      ...req.body,
      instituteId,
      createdBy: req.user._id,
    });
    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "exam",
      entityId: exam._id,
      message: "Exam created",
    });
    res.status(201).json({ message: "Exam created successfully", exam: sanitizeExam(exam) });
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = { instituteId, isDeleted: false };
    if (req.query.academicGroupId && req.query.academicGroupId !== "all") query.academicGroupId = req.query.academicGroupId;
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;
    if (req.query.examType && req.query.examType !== "all") query.examType = req.query.examType;
    if (req.user?.role === "teacher") {
      const groups = (req.user.assignedAcademicGroups || []).map((value) => value._id || value);
      query.academicGroupId = { $in: groups };
    }
    if (req.user?.role === "student") {
      const student = await Student.findOne({ userId: req.user._id, isDeleted: false });
      query.academicGroupId = student?.academicGroupId || null;
    }
    if (req.user?.role === "parent") {
      const linkedStudents = await Student.find({
        _id: { $in: req.user.linkedStudentIds || [] },
        isDeleted: false,
      }).select("academicGroupId");
      query.academicGroupId = { $in: linkedStudents.map((student) => student.academicGroupId) };
    }
    const exams = await Exam.find(query).populate("academicGroupId", "className section department course semester year").sort({ startDate: -1 });
    res.json({ exams: exams.map(sanitizeExam) });
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, isDeleted: false }).populate("academicGroupId", "className section department course semester year");
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }
    if (!ensureInstituteScope(req, exam.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this exam");
    }
    if (req.user?.role === "teacher" && !ensureTeacherAcademicGroupAccess(req, exam.academicGroupId?._id || exam.academicGroupId)) {
      res.status(403);
      throw new Error("Access denied for this exam");
    }
    res.json({ exam: sanitizeExam(exam) });
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, isDeleted: false });
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }
    if (!ensureInstituteScope(req, exam.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this exam");
    }
    const validationError = await validateExam(req, { ...exam.toObject(), ...req.body });
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }
    Object.assign(exam, req.body);
    await exam.save();
    await createAuditLog({
      req,
      instituteId: exam.instituteId,
      action: "update",
      entity: "exam",
      entityId: exam._id,
      message: "Exam updated",
    });
    res.json({ message: "Exam updated successfully", exam: sanitizeExam(exam) });
  } catch (error) {
    next(error);
  }
};

const updateExamStatus = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, isDeleted: false });
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }
    if (!ensureInstituteScope(req, exam.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this exam");
    }
    exam.status = req.body.status;
    await exam.save();

    // Notify students and parents when exam is scheduled/published
    if ((req.body.status === "scheduled" || req.body.status === "published") && exam.academicGroupId) {
      const studentUserIds = await getUserIdsByRole("student", exam.instituteId, exam.academicGroupId);
      if (studentUserIds.length > 0) {
        const recipientUserIds = [...studentUserIds];
        // Also notify parents
        for (const studentId of studentUserIds) {
          const student = await Student.findOne({ userId: studentId, instituteId: exam.instituteId, isDeleted: false }).select("_id");
          if (student) {
            const parentUserIds = await getParentUserIdsForStudent(student._id);
            recipientUserIds.push(...parentUserIds);
          }
        }

        await createNotification({
          instituteId: exam.instituteId,
          recipientUserId: recipientUserIds,
          title: `Exam Scheduled: ${exam.examName}`,
          message: `${exam.examType} exam scheduled from ${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}`,
          type: "exam",
          link: `/student/exams`,
          priority: exam.startDate && new Date(exam.startDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "high" : "normal",
          createdBy: req.user._id,
          metadata: { examId: exam._id },
        });
      }
    }

    await createAuditLog({
      req,
      instituteId: exam.instituteId,
      action: "status_update",
      entity: "exam",
      entityId: exam._id,
      message: `Exam marked ${exam.status}`,
    });
    res.json({ message: "Exam status updated successfully", exam: sanitizeExam(exam) });
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, isDeleted: false });
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }
    if (!ensureInstituteScope(req, exam.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this exam");
    }
    exam.isDeleted = true;
    exam.deletedAt = new Date();
    await exam.save();
    await createAuditLog({
      req,
      instituteId: exam.instituteId,
      action: "delete",
      entity: "exam",
      entityId: exam._id,
      message: "Exam deleted",
    });
    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export { createExam, getExams, getExamById, updateExam, updateExamStatus, deleteExam };
