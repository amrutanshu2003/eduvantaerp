import AcademicGroup from "../models/AcademicGroup.js";
import Exam from "../models/Exam.js";
import Marks from "../models/Marks.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import createAuditLog from "../utils/audit.js";
import { calculateGrade } from "../utils/grades.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import {
  ensureParentStudentAccess,
  ensureTeacherAcademicGroupAccess,
  ensureTeacherSubjectAccess,
  getStudentProfileForUser,
} from "../utils/roleAccess.js";

const sanitizeMarks = (marks) => ({
  _id: marks._id,
  instituteId: marks.instituteId,
  examId: marks.examId,
  academicGroupId: marks.academicGroupId,
  subjectId: marks.subjectId,
  studentId: marks.studentId,
  marksObtained: marks.marksObtained,
  totalMarks: marks.totalMarks,
  passingMarks: marks.passingMarks,
  grade: marks.grade,
  remarks: marks.remarks,
  uploadedBy: marks.uploadedBy,
  status: marks.status,
  createdAt: marks.createdAt,
  updatedAt: marks.updatedAt,
});

const validateMarksPayload = async (req, payload, marksId = null) => {
  if (!payload.examId || !payload.academicGroupId || !payload.subjectId || !payload.studentId) {
    return "Exam, academic group, subject, and student are required";
  }
  const instituteId = getScopedInstituteId(req, true);

  const [exam, group, subject, student] = await Promise.all([
    Exam.findOne({ _id: payload.examId, instituteId, isDeleted: false }),
    AcademicGroup.findOne({ _id: payload.academicGroupId, instituteId, isDeleted: false }),
    Subject.findOne({ _id: payload.subjectId, instituteId, isDeleted: false }),
    Student.findOne({ _id: payload.studentId, instituteId, isDeleted: false }),
  ]);

  if (!exam) return "Exam not found";
  if (!group) return "Academic group not found";
  if (!subject) return "Subject not found";
  if (!student) return "Student not found";
  if (String(subject.academicGroupId) !== String(payload.academicGroupId)) {
    return "Subject does not belong to the selected academic group";
  }
  if (String(student.academicGroupId) !== String(payload.academicGroupId)) {
    return "Student does not belong to the selected academic group";
  }
  if (req.user?.role === "teacher") {
    if (!ensureTeacherAcademicGroupAccess(req, payload.academicGroupId)) {
      return "Teacher can only upload marks for assigned academic groups";
    }
    if (!ensureTeacherSubjectAccess(req, subject)) {
      return "Teacher can only upload marks for assigned subjects";
    }
  }

  const duplicate = await Marks.findOne({
    _id: { $ne: marksId },
    instituteId,
    examId: payload.examId,
    subjectId: payload.subjectId,
    studentId: payload.studentId,
    isDeleted: false,
  });
  if (duplicate) {
    return "Marks already exist for this exam, subject, and student";
  }

  return null;
};

const createMarks = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const validationError = await validateMarksPayload(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }
    const grade = calculateGrade(Number(req.body.marksObtained));
    const marks = await Marks.create({
      ...req.body,
      instituteId,
      grade,
      uploadedBy: req.user._id,
    });
    await createAuditLog({
      req,
      instituteId,
      action: "upload",
      entity: "marks",
      entityId: marks._id,
      message: "Marks uploaded",
    });
    res.status(201).json({ message: "Marks created successfully", marks: sanitizeMarks(marks) });
  } catch (error) {
    next(error);
  }
};

const getMarks = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = { instituteId, isDeleted: false };
    if (req.query.examId && req.query.examId !== "all") query.examId = req.query.examId;
    if (req.query.academicGroupId && req.query.academicGroupId !== "all") query.academicGroupId = req.query.academicGroupId;
    if (req.query.subjectId && req.query.subjectId !== "all") query.subjectId = req.query.subjectId;
    if (req.query.studentId && req.query.studentId !== "all") query.studentId = req.query.studentId;
    if (req.user?.role === "teacher") query.uploadedBy = req.user._id;

    const marks = await Marks.find(query)
      .populate("examId", "examName examType status")
      .populate("academicGroupId", "className section department course semester year")
      .populate("subjectId", "subjectName subjectCode")
      .populate("studentId", "rollNumber admissionNumber")
      .sort({ createdAt: -1 });

    res.json({ marks: marks.map(sanitizeMarks) });
  } catch (error) {
    next(error);
  }
};

const getMarksById = async (req, res, next) => {
  try {
    const marks = await Marks.findOne({ _id: req.params.id, isDeleted: false })
      .populate("examId", "examName examType status")
      .populate("subjectId", "subjectName subjectCode teacherId")
      .populate("studentId");

    if (!marks) {
      res.status(404);
      throw new Error("Marks record not found");
    }
    if (!ensureInstituteScope(req, marks.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this marks record");
    }
    if (req.user?.role === "teacher" && String(marks.uploadedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only view their own uploaded marks");
    }

    res.json({ marks: sanitizeMarks(marks) });
  } catch (error) {
    next(error);
  }
};

const updateMarks = async (req, res, next) => {
  try {
    const marks = await Marks.findOne({ _id: req.params.id, isDeleted: false });
    if (!marks) {
      res.status(404);
      throw new Error("Marks record not found");
    }
    if (!ensureInstituteScope(req, marks.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this marks record");
    }
    if (req.user?.role === "teacher" && String(marks.uploadedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only edit their own uploaded marks");
    }

    const validationError = await validateMarksPayload(req, { ...marks.toObject(), ...req.body }, marks._id);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    Object.assign(marks, req.body);
    marks.grade = calculateGrade(Number(marks.marksObtained));
    await marks.save();
    await createAuditLog({
      req,
      instituteId: marks.instituteId,
      action: "update",
      entity: "marks",
      entityId: marks._id,
      message: "Marks updated",
    });

    res.json({ message: "Marks updated successfully", marks: sanitizeMarks(marks) });
  } catch (error) {
    next(error);
  }
};

const updateMarksStatus = async (req, res, next) => {
  try {
    const marks = await Marks.findOne({ _id: req.params.id, isDeleted: false });
    if (!marks) {
      res.status(404);
      throw new Error("Marks record not found");
    }
    if (!ensureInstituteScope(req, marks.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this marks record");
    }
    if (req.user?.role === "teacher" && String(marks.uploadedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only update their own marks status");
    }

    marks.status = req.body.status;
    await marks.save();
    await createAuditLog({
      req,
      instituteId: marks.instituteId,
      action: "status_update",
      entity: "marks",
      entityId: marks._id,
      message: `Marks marked ${marks.status}`,
    });
    res.json({ message: "Marks status updated successfully", marks: sanitizeMarks(marks) });
  } catch (error) {
    next(error);
  }
};

const publishMarks = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = { instituteId, isDeleted: false };
    if (req.body.examId) query.examId = req.body.examId;
    if (req.body.academicGroupId) query.academicGroupId = req.body.academicGroupId;
    if (req.body.subjectId) query.subjectId = req.body.subjectId;
    const result = await Marks.updateMany(query, { status: "published" });
    await createAuditLog({
      req,
      instituteId,
      action: "publish",
      entity: "marks",
      entityId: null,
      message: "Marks published",
    });
    res.json({ message: "Marks published successfully", modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

const deleteMarks = async (req, res, next) => {
  try {
    const marks = await Marks.findOne({ _id: req.params.id, isDeleted: false });
    if (!marks) {
      res.status(404);
      throw new Error("Marks record not found");
    }
    if (!ensureInstituteScope(req, marks.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this marks record");
    }
    if (req.user?.role === "teacher" && String(marks.uploadedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only delete their own marks");
    }

    marks.isDeleted = true;
    marks.deletedAt = new Date();
    await marks.save();
    await createAuditLog({
      req,
      instituteId: marks.instituteId,
      action: "delete",
      entity: "marks",
      entityId: marks._id,
      message: "Marks deleted",
    });
    res.json({ message: "Marks deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const buildStudentResultSummary = async (studentId, viewerRole = "student") => {
  const query = { studentId, isDeleted: false };
  if (viewerRole !== "admin" && viewerRole !== "teacher") {
    query.status = "published";
  }
  const marksList = await Marks.find(query)
    .populate("examId", "examName examType status")
    .populate("subjectId", "subjectName subjectCode")
    .sort({ createdAt: -1 });
  const totalObtained = marksList.reduce((sum, item) => sum + Number(item.marksObtained || 0), 0);
  const totalPossible = marksList.reduce((sum, item) => sum + Number(item.totalMarks || 0), 0);
  const percentage = totalPossible ? Number(((totalObtained / totalPossible) * 100).toFixed(2)) : 0;
  const pass = marksList.every((item) => Number(item.marksObtained) >= Number(item.passingMarks));
  return {
    marks: marksList.map(sanitizeMarks),
    summary: {
      totalObtained,
      totalPossible,
      percentage,
      grade: calculateGrade(percentage),
      result: pass ? "Pass" : "Fail",
    },
  };
};

const getStudentResult = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }
    if (req.user?.role === "teacher" && !ensureTeacherAcademicGroupAccess(req, student.academicGroupId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const result = await buildStudentResultSummary(student._id, req.user?.role || "student");
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyResult = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    req.params.studentId = student._id;
    return getStudentResult(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getChildResult = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this child");
    }
    return getStudentResult(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getExamAcademicGroupResults = async (req, res, next) => {
  try {
    const query = {
      examId: req.params.examId,
      academicGroupId: req.params.academicGroupId,
      isDeleted: false,
    };
    const marks = await Marks.find(query)
      .populate("studentId", "rollNumber admissionNumber")
      .populate("subjectId", "subjectName subjectCode")
      .sort({ createdAt: -1 });
    if (!marks.length) {
      return res.json({ marks: [], summary: { totalRecords: 0 } });
    }
    if (!ensureInstituteScope(req, marks[0].instituteId)) {
      res.status(403);
      throw new Error("Access denied for these results");
    }
    res.json({ marks: marks.map(sanitizeMarks), summary: { totalRecords: marks.length } });
  } catch (error) {
    next(error);
  }
};

export {
  createMarks,
  getMarks,
  getMarksById,
  updateMarks,
  updateMarksStatus,
  publishMarks,
  deleteMarks,
  getStudentResult,
  getMyResult,
  getChildResult,
  getExamAcademicGroupResults,
};
