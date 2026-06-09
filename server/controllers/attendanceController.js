import AcademicGroup from "../models/AcademicGroup.js";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import {
  ensureParentStudentAccess,
  ensureTeacherAcademicGroupAccess,
  ensureTeacherSubjectAccess,
  getStudentProfileForUser,
} from "../utils/roleAccess.js";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const sanitizeAttendance = (attendance) => ({
  _id: attendance._id,
  instituteId: attendance.instituteId,
  academicGroupId: attendance.academicGroupId,
  subjectId: attendance.subjectId,
  date: attendance.date,
  startTime: attendance.startTime,
  endTime: attendance.endTime,
  markedBy: attendance.markedBy,
  records: attendance.records,
  status: attendance.status,
  createdBy: attendance.createdBy,
  updatedBy: attendance.updatedBy,
  createdAt: attendance.createdAt,
  updatedAt: attendance.updatedAt,
});

const validateAttendancePayload = async (req, payload, attendanceId = null) => {
  if (!payload.academicGroupId || !payload.date) {
    return "Academic group and date are required";
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

  if (req.user?.role === "teacher" && !ensureTeacherAcademicGroupAccess(req, payload.academicGroupId)) {
    return "Teacher can only mark attendance for assigned academic groups";
  }

  if (payload.subjectId) {
    const subject = await Subject.findOne({
      _id: payload.subjectId,
      instituteId,
      academicGroupId: payload.academicGroupId,
      isDeleted: false,
    });
    if (!subject) {
      return "Subject not found for this academic group";
    }
    if (req.user?.role === "teacher" && !ensureTeacherSubjectAccess(req, subject)) {
      return "Teacher can only mark attendance for assigned subjects";
    }
  }

  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    return "Attendance records are required";
  }

  const studentIds = payload.records.map((record) => record.studentId);
  const students = await Student.find({
    _id: { $in: studentIds },
    instituteId,
    academicGroupId: payload.academicGroupId,
    isDeleted: false,
  });

  if (students.length !== studentIds.length) {
    return "One or more students are invalid for this academic group";
  }

  const duplicateAttendance = await Attendance.findOne({
    _id: { $ne: attendanceId },
    instituteId,
    academicGroupId: payload.academicGroupId,
    subjectId: payload.subjectId || null,
    date: startOfDay(payload.date),
    isDeleted: false,
  });

  if (duplicateAttendance) {
    return "Attendance already exists for this academic group, subject, and date";
  }

  return null;
};

const createAttendance = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const payload = { ...req.body, date: startOfDay(req.body.date) };
    const validationError = await validateAttendancePayload(req, payload);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const attendance = await Attendance.create({
      ...payload,
      instituteId,
      subjectId: payload.subjectId || null,
      markedBy: req.user._id,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "submit",
      entity: "attendance",
      entityId: attendance._id,
      message: "Attendance submitted",
    });

    res.status(201).json({ message: "Attendance created successfully", attendance: sanitizeAttendance(attendance) });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const query = { instituteId, isDeleted: false };

    if (req.query.academicGroupId && req.query.academicGroupId !== "all") query.academicGroupId = req.query.academicGroupId;
    if (req.query.subjectId && req.query.subjectId !== "all") query.subjectId = req.query.subjectId;
    if (req.query.studentId && req.query.studentId !== "all") query["records.studentId"] = req.query.studentId;
    if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) query.date.$gte = startOfDay(req.query.dateFrom);
      if (req.query.dateTo) query.date.$lte = endOfDay(req.query.dateTo);
    }

    if (req.user?.role === "teacher") {
      const groups = (req.user.assignedAcademicGroups || []).map((value) => value._id || value);
      query.academicGroupId = { $in: groups };
    }

    const attendance = await Attendance.find(query)
      .populate("academicGroupId", "className section department course semester year")
      .populate("subjectId", "subjectName subjectCode")
      .populate("markedBy", "name role")
      .populate("records.studentId", "rollNumber admissionNumber")
      .sort({ date: -1 });

    res.json({ attendance: attendance.map(sanitizeAttendance) });
  } catch (error) {
    next(error);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, isDeleted: false })
      .populate("academicGroupId", "className section department course semester year")
      .populate("subjectId", "subjectName subjectCode teacherId")
      .populate("records.studentId");

    if (!attendance) {
      res.status(404);
      throw new Error("Attendance record not found");
    }
    if (!ensureInstituteScope(req, attendance.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this attendance record");
    }
    if (req.user?.role === "teacher") {
      if (!ensureTeacherAcademicGroupAccess(req, attendance.academicGroupId?._id || attendance.academicGroupId)) {
        res.status(403);
        throw new Error("Access denied for this attendance record");
      }
      if (String(attendance.markedBy?._id || attendance.markedBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error("Teacher can only view their own attendance records");
      }
    }

    res.json({ attendance: sanitizeAttendance(attendance) });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, isDeleted: false });
    if (!attendance) {
      res.status(404);
      throw new Error("Attendance record not found");
    }
    if (!ensureInstituteScope(req, attendance.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this attendance record");
    }
    if (req.user?.role === "teacher" && String(attendance.markedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only edit attendance they marked");
    }

    const payload = {
      ...attendance.toObject(),
      ...req.body,
      date: req.body.date ? startOfDay(req.body.date) : attendance.date,
      subjectId: req.body.subjectId || attendance.subjectId || null,
    };
    const validationError = await validateAttendancePayload(req, payload, attendance._id);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    Object.assign(attendance, payload, { updatedBy: req.user._id });
    await attendance.save();
    await createAuditLog({
      req,
      instituteId: attendance.instituteId,
      action: "update",
      entity: "attendance",
      entityId: attendance._id,
      message: "Attendance updated",
    });

    res.json({ message: "Attendance updated successfully", attendance: sanitizeAttendance(attendance) });
  } catch (error) {
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, isDeleted: false });
    if (!attendance) {
      res.status(404);
      throw new Error("Attendance record not found");
    }
    if (!ensureInstituteScope(req, attendance.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this attendance record");
    }
    if (req.user?.role === "teacher" && String(attendance.markedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Teacher can only delete attendance they marked");
    }

    attendance.isDeleted = true;
    attendance.deletedAt = new Date();
    await attendance.save();
    await createAuditLog({
      req,
      instituteId: attendance.instituteId,
      action: "delete",
      entity: "attendance",
      entityId: attendance._id,
      message: "Attendance deleted",
    });

    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const summarizeAttendance = (attendanceList, studentId) => {
  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: 0, percentage: 0 };
  attendanceList.forEach((entry) => {
    const record = entry.records.find((item) => String(item.studentId?._id || item.studentId) === String(studentId));
    if (!record) return;
    summary[record.status] += 1;
    summary.total += 1;
  });
  summary.percentage = summary.total ? Number((((summary.present + summary.late) / summary.total) * 100).toFixed(2)) : 0;
  return summary;
};

const getAcademicGroupAttendanceReport = async (req, res, next) => {
  try {
    const academicGroup = await AcademicGroup.findOne({ _id: req.params.academicGroupId, isDeleted: false });
    if (!academicGroup) {
      res.status(404);
      throw new Error("Academic group not found");
    }
    if (!ensureInstituteScope(req, academicGroup.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }
    if (req.user?.role === "teacher" && !ensureTeacherAcademicGroupAccess(req, academicGroup._id)) {
      res.status(403);
      throw new Error("Access denied for this academic group");
    }

    const query = {
      instituteId: academicGroup.instituteId,
      academicGroupId: academicGroup._id,
      isDeleted: false,
    };
    if (req.query.subjectId && req.query.subjectId !== "all") query.subjectId = req.query.subjectId;
    if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) query.date.$gte = startOfDay(req.query.dateFrom);
      if (req.query.dateTo) query.date.$lte = endOfDay(req.query.dateTo);
    }

    const attendanceList = await Attendance.find(query).populate("records.studentId", "rollNumber admissionNumber");
    const studentSummary = {};

    attendanceList.forEach((entry) => {
      entry.records.forEach((record) => {
        const key = String(record.studentId?._id || record.studentId);
        if (!studentSummary[key]) {
          studentSummary[key] = {
            studentId: key,
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            total: 0,
          };
        }
        studentSummary[key][record.status] += 1;
        studentSummary[key].total += 1;
      });
    });

    const summary = Object.values(studentSummary).map((item) => ({
      ...item,
      percentage: item.total ? Number((((item.present + item.late) / item.total) * 100).toFixed(2)) : 0,
    }));

    res.json({ attendance: attendanceList.map(sanitizeAttendance), summary });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendanceReport = async (req, res, next) => {
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

    const query = {
      instituteId: student.instituteId,
      "records.studentId": student._id,
      isDeleted: false,
    };
    if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) query.date.$gte = startOfDay(req.query.dateFrom);
      if (req.query.dateTo) query.date.$lte = endOfDay(req.query.dateTo);
    }

    const attendanceList = await Attendance.find(query)
      .populate("subjectId", "subjectName subjectCode")
      .sort({ date: -1 });
    const summary = summarizeAttendance(attendanceList, student._id);

    const sanitizedAttendanceList = attendanceList.map((item) => {
      const sanitized = sanitizeAttendance(item);
      const studentRecord = item.records.find(
        (r) => String(r.studentId?._id || r.studentId) === String(student._id)
      );
      sanitized.studentStatus = studentRecord ? studentRecord.status : null;
      sanitized.studentRemarks = studentRecord ? studentRecord.remarks : "";
      return sanitized;
    });

    res.json({ attendance: sanitizedAttendanceList, summary });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    req.params.studentId = student._id;
    return getStudentAttendanceReport(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getChildAttendance = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this child");
    }
    return getStudentAttendanceReport(req, res, next);
  } catch (error) {
    next(error);
  }
};

export {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAcademicGroupAttendanceReport,
  getStudentAttendanceReport,
  getMyAttendance,
  getChildAttendance,
};
