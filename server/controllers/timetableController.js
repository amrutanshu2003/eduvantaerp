import AcademicGroup from "../models/AcademicGroup.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Timetable from "../models/Timetable.js";
import Teacher from "../models/Teacher.js";
import createAuditLog from "../utils/audit.js";
import { ensureParentStudentAccess, ensureTeacherAcademicGroupAccess, getStudentProfileForUser } from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { sanitizeTimetable, timeToMinutes } from "../utils/timetableUtils.js";

const populateTimetable = (query) =>
  query
    .populate("academicGroupId", "className section department course semester year batch instituteType")
    .populate("periods.subjectId", "subjectName subjectCode")
    .populate("periods.teacherId", "name email")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const validatePeriods = async (req, academicGroupId, dayOfWeek, periods, timetableId = null) => {
  if (!Array.isArray(periods) || periods.length === 0) {
    return "At least one timetable period is required";
  }

  const instituteId = getScopedInstituteId(req, false);
  const periodNumbers = new Set();
  const teacherWindows = [];
  const normalizedPeriods = [];

  for (const period of periods) {
    if (!period.periodNumber || !period.startTime || !period.endTime) {
      return "Each period requires period number, start time, and end time";
    }

    if (periodNumbers.has(Number(period.periodNumber))) {
      return "Period numbers must be unique within a day";
    }

    const start = timeToMinutes(period.startTime);
    const end = timeToMinutes(period.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      return "Each period must have a valid time range";
    }

    if (period.type !== "break" && (!period.subjectId || !period.teacherId)) {
      return "Subject and teacher are required for non-break periods";
    }

    if (period.type === "break") {
      period.subjectId = null;
      period.teacherId = null;
    }

    if (period.subjectId) {
      const subject = await Subject.findOne({
        _id: period.subjectId,
        instituteId,
        academicGroupId,
        isDeleted: false,
      });
      if (!subject) {
        return "Subject not found for this academic group";
      }
    }

    if (period.teacherId) {
      const teacher = await Teacher.findOne({
        _id: period.teacherId,
        instituteId,
        isDeleted: false,
      });
      if (!teacher) {
        return "Teacher not found for this institute";
      }
    }

    normalizedPeriods.push({
      ...period,
      periodNumber: Number(period.periodNumber),
      start,
      end,
    });
    periodNumbers.add(Number(period.periodNumber));
  }

  normalizedPeriods.sort((a, b) => a.start - b.start);
  for (let index = 1; index < normalizedPeriods.length; index += 1) {
    if (normalizedPeriods[index].start < normalizedPeriods[index - 1].end) {
      return "Academic group periods cannot overlap on the same day";
    }
  }

  normalizedPeriods.forEach((period) => {
    if (period.teacherId) {
      teacherWindows.push(period);
    }
  });

  for (const period of teacherWindows) {
    const possibleConflicts = await Timetable.find({
      _id: { $ne: timetableId },
      instituteId,
      dayOfWeek,
      status: "active",
      isDeleted: false,
      "periods.teacherId": period.teacherId,
    }).select("periods");

    for (const conflict of possibleConflicts) {
      for (const conflictPeriod of conflict.periods) {
        if (String(conflictPeriod.teacherId || "") !== String(period.teacherId)) continue;
        const start = timeToMinutes(conflictPeriod.startTime);
        const end = timeToMinutes(conflictPeriod.endTime);
        if (period.start < end && start < period.end) {
          return "Teacher has an overlapping timetable period on this day";
        }
      }
    }
  }

  return null;
};

const validateTimetablePayload = async (req, payload, timetableId = null) => {
  const instituteId = getScopedInstituteId(req, false);

  if (!payload.academicGroupId || !payload.dayOfWeek) {
    return "Academic group and day of week are required";
  }

  const academicGroup = await AcademicGroup.findOne({
    _id: payload.academicGroupId,
    instituteId,
    isDeleted: false,
  });
  if (!academicGroup) {
    return "Academic group not found for this institute";
  }

  return validatePeriods(req, payload.academicGroupId, payload.dayOfWeek, payload.periods, timetableId);
};

const createTimetable = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const validationError = await validateTimetablePayload(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const timetable = await Timetable.create({
      instituteId,
      academicGroupId: req.body.academicGroupId,
      dayOfWeek: req.body.dayOfWeek,
      periods: req.body.periods,
      status: req.body.status || "active",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "timetable",
      entityId: timetable._id,
      message: "Timetable created",
    });

    res.status(201).json({ message: "Timetable created successfully", timetable: sanitizeTimetable(timetable) });
  } catch (error) {
    next(error);
  }
};

const getTimetables = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };

    if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
      query.academicGroupId = req.query.academicGroupId;
    }
    if (req.query.dayOfWeek && req.query.dayOfWeek !== "all") {
      query.dayOfWeek = req.query.dayOfWeek;
    }
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    let timetables = await populateTimetable(Timetable.find(query).sort({ dayOfWeek: 1, createdAt: -1 }));

    if (req.query.teacherId && req.query.teacherId !== "all") {
      timetables = timetables.filter((timetable) =>
        timetable.periods.some((period) => String(period.teacherId?._id || period.teacherId || "") === String(req.query.teacherId))
      );
    }

    res.json({ timetables: timetables.map(sanitizeTimetable) });
  } catch (error) {
    next(error);
  }
};

const getTimetableById = async (req, res, next) => {
  try {
    const timetable = await populateTimetable(Timetable.findOne({ _id: req.params.id, isDeleted: false }));

    if (!timetable) {
      res.status(404);
      throw new Error("Timetable not found");
    }
    if (!ensureInstituteScope(req, timetable.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this timetable");
    }

    res.json({ timetable: sanitizeTimetable(timetable) });
  } catch (error) {
    next(error);
  }
};

const updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, isDeleted: false });
    if (!timetable) {
      res.status(404);
      throw new Error("Timetable not found");
    }
    if (!ensureInstituteScope(req, timetable.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this timetable");
    }

    const validationError = await validateTimetablePayload(req, { ...timetable.toObject(), ...req.body }, timetable._id);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    timetable.academicGroupId = req.body.academicGroupId ?? timetable.academicGroupId;
    timetable.dayOfWeek = req.body.dayOfWeek ?? timetable.dayOfWeek;
    timetable.periods = req.body.periods ?? timetable.periods;
    timetable.status = req.body.status ?? timetable.status;
    timetable.updatedBy = req.user._id;
    await timetable.save();

    await createAuditLog({
      req,
      instituteId: timetable.instituteId,
      action: "update",
      entity: "timetable",
      entityId: timetable._id,
      message: "Timetable updated",
    });

    res.json({ message: "Timetable updated successfully", timetable: sanitizeTimetable(timetable) });
  } catch (error) {
    next(error);
  }
};

const updateTimetableStatus = async (req, res, next) => {
  try {
    if (!["active", "inactive"].includes(req.body.status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const timetable = await Timetable.findOne({ _id: req.params.id, isDeleted: false });
    if (!timetable) {
      res.status(404);
      throw new Error("Timetable not found");
    }
    if (!ensureInstituteScope(req, timetable.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this timetable");
    }

    timetable.status = req.body.status;
    timetable.updatedBy = req.user._id;
    await timetable.save();

    await createAuditLog({
      req,
      instituteId: timetable.instituteId,
      action: "status_update",
      entity: "timetable",
      entityId: timetable._id,
      message: `Timetable marked ${req.body.status}`,
    });

    res.json({ message: "Timetable status updated successfully", timetable: sanitizeTimetable(timetable) });
  } catch (error) {
    next(error);
  }
};

const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, isDeleted: false });
    if (!timetable) {
      res.status(404);
      throw new Error("Timetable not found");
    }
    if (!ensureInstituteScope(req, timetable.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this timetable");
    }

    timetable.isDeleted = true;
    timetable.deletedAt = new Date();
    timetable.status = "inactive";
    timetable.updatedBy = req.user._id;
    await timetable.save();

    await createAuditLog({
      req,
      instituteId: timetable.instituteId,
      action: "soft_delete",
      entity: "timetable",
      entityId: timetable._id,
      message: "Timetable deleted",
    });

    res.json({ message: "Timetable deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getTeacherTimetable = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const timetables = await populateTimetable(
      Timetable.find({
        instituteId,
        status: "active",
        isDeleted: false,
        "periods.teacherId": req.user._id,
      }).sort({ dayOfWeek: 1, createdAt: -1 })
    );

    res.json({
      timetables: timetables
        .map((timetable) => ({
          ...sanitizeTimetable(timetable),
          periods: timetable.periods.filter((period) => String(period.teacherId?._id || period.teacherId || "") === String(req.user._id)),
        }))
        .filter((timetable) => timetable.periods.length > 0),
    });
  } catch (error) {
    next(error);
  }
};

const getMyTimetable = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const timetables = await populateTimetable(
      Timetable.find({
        instituteId: student.instituteId,
        academicGroupId: student.academicGroupId,
        status: "active",
        isDeleted: false,
      }).sort({ dayOfWeek: 1, createdAt: -1 })
    );

    res.json({ timetables: timetables.map(sanitizeTimetable) });
  } catch (error) {
    next(error);
  }
};

const getChildTimetable = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({ _id: req.params.studentId, instituteId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const timetables = await populateTimetable(
      Timetable.find({
        instituteId,
        academicGroupId: student.academicGroupId,
        status: "active",
        isDeleted: false,
      }).sort({ dayOfWeek: 1, createdAt: -1 })
    );

    res.json({ timetables: timetables.map(sanitizeTimetable) });
  } catch (error) {
    next(error);
  }
};

export {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  updateTimetableStatus,
  deleteTimetable,
  getTeacherTimetable,
  getMyTimetable,
  getChildTimetable,
};
