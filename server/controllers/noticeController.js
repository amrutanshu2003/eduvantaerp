import AcademicGroup from "../models/AcademicGroup.js";
import Notice from "../models/Notice.js";
import Student from "../models/Student.js";
import createAuditLog from "../utils/audit.js";
import { buildPublishedNoticeQuery, sanitizeNotice } from "../utils/noticeUtils.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const populateNotice = (query) =>
  query
    .populate("academicGroupId", "className section department course semester year")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const validateNoticePayload = async (req, payload) => {
  const instituteId = getScopedInstituteId(req, false);

  if (!payload.title?.trim() || !payload.description?.trim()) {
    return "Title and description are required";
  }

  if (payload.audience === "academic_group" && !payload.academicGroupId) {
    return "Academic group is required for academic group notices";
  }

  if (payload.academicGroupId) {
    const group = await AcademicGroup.findOne({
      _id: payload.academicGroupId,
      instituteId,
      isDeleted: false,
    });

    if (!group) {
      return "Academic group not found for this institute";
    }
  }

  if (payload.expiryDate && payload.publishDate && new Date(payload.expiryDate) < new Date(payload.publishDate)) {
    return "Expiry date cannot be earlier than publish date";
  }

  return null;
};

const createNotice = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const validationError = await validateNoticePayload(req, req.body);

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const notice = await Notice.create({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      noticeType: req.body.noticeType || "general",
      audience: req.body.audience || "all",
      academicGroupId: req.body.audience === "academic_group" ? req.body.academicGroupId : null,
      priority: req.body.priority || "normal",
      publishDate: req.body.publishDate || new Date(),
      expiryDate: req.body.expiryDate || null,
      status: req.body.status || "draft",
      instituteId,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "notice",
      entityId: notice._id,
      message: "Notice created",
    });

    res.status(201).json({ message: "Notice created successfully", notice: sanitizeNotice(notice) });
  } catch (error) {
    next(error);
  }
};

const getNotices = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }
    if (req.query.audience && req.query.audience !== "all") {
      query.audience = req.query.audience;
    }
    if (req.query.priority && req.query.priority !== "all") {
      query.priority = req.query.priority;
    }
    if (req.query.noticeType && req.query.noticeType !== "all") {
      query.noticeType = req.query.noticeType;
    }
    if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
      query.academicGroupId = req.query.academicGroupId;
    }
    if (req.query.search?.trim()) {
      query.$or = [
        { title: { $regex: req.query.search.trim(), $options: "i" } },
        { description: { $regex: req.query.search.trim(), $options: "i" } },
      ];
    }

    const notices = await populateNotice(Notice.find(query).sort({ publishDate: -1, createdAt: -1 }));
    res.json({ notices: notices.map(sanitizeNotice) });
  } catch (error) {
    next(error);
  }
};

const getMyNotices = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    let academicGroupIds = [];

    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id, instituteId, isDeleted: false });
      if (!student) {
        res.status(404);
        throw new Error("Student profile not found");
      }
      if (student.academicGroupId) {
        academicGroupIds = [student.academicGroupId];
      }
    }

    if (req.user.role === "parent") {
      const linkedStudents = await Student.find({
        _id: { $in: req.user.linkedStudentIds || [] },
        instituteId,
        isDeleted: false,
      }).select("academicGroupId");

      academicGroupIds = linkedStudents
        .map((student) => student.academicGroupId)
        .filter(Boolean);
    }

    const notices = await populateNotice(
      Notice.find(buildPublishedNoticeQuery({ instituteId, role: req.user.role, academicGroupIds })).sort({
        priority: -1,
        publishDate: -1,
        createdAt: -1,
      })
    );

    res.json({ notices: notices.map(sanitizeNotice) });
  } catch (error) {
    next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    const notice = await populateNotice(Notice.findOne({ _id: req.params.id, isDeleted: false }));

    if (!notice) {
      res.status(404);
      throw new Error("Notice not found");
    }

    if (!ensureInstituteScope(req, notice.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this notice");
    }

    res.json({ notice: sanitizeNotice(notice) });
  } catch (error) {
    next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false });

    if (!notice) {
      res.status(404);
      throw new Error("Notice not found");
    }

    if (!ensureInstituteScope(req, notice.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this notice");
    }

    const mergedPayload = {
      ...notice.toObject(),
      ...req.body,
    };
    const validationError = await validateNoticePayload(req, mergedPayload);

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    notice.title = req.body.title?.trim() ?? notice.title;
    notice.description = req.body.description?.trim() ?? notice.description;
    notice.noticeType = req.body.noticeType ?? notice.noticeType;
    notice.audience = req.body.audience ?? notice.audience;
    notice.academicGroupId = (req.body.audience ?? notice.audience) === "academic_group"
      ? req.body.academicGroupId ?? notice.academicGroupId
      : null;
    notice.priority = req.body.priority ?? notice.priority;
    notice.publishDate = req.body.publishDate ?? notice.publishDate;
    notice.expiryDate = req.body.expiryDate === "" ? null : req.body.expiryDate ?? notice.expiryDate;
    notice.status = req.body.status ?? notice.status;
    notice.updatedBy = req.user._id;

    await notice.save();

    await createAuditLog({
      req,
      instituteId: notice.instituteId,
      action: "update",
      entity: "notice",
      entityId: notice._id,
      message: "Notice updated",
    });

    res.json({ message: "Notice updated successfully", notice: sanitizeNotice(notice) });
  } catch (error) {
    next(error);
  }
};

const updateNoticeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["draft", "published", "archived"].includes(status)) {
      res.status(400);
      throw new Error("Status must be draft, published, or archived");
    }

    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false });

    if (!notice) {
      res.status(404);
      throw new Error("Notice not found");
    }

    if (!ensureInstituteScope(req, notice.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this notice");
    }

    notice.status = status;
    notice.updatedBy = req.user._id;
    await notice.save();

    await createAuditLog({
      req,
      instituteId: notice.instituteId,
      action: "status_update",
      entity: "notice",
      entityId: notice._id,
      message: `Notice marked ${status}`,
    });

    res.json({ message: "Notice status updated successfully", notice: sanitizeNotice(notice) });
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false });

    if (!notice) {
      res.status(404);
      throw new Error("Notice not found");
    }

    if (!ensureInstituteScope(req, notice.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this notice");
    }

    notice.isDeleted = true;
    notice.deletedAt = new Date();
    notice.status = "archived";
    notice.updatedBy = req.user._id;
    await notice.save();

    await createAuditLog({
      req,
      instituteId: notice.instituteId,
      action: "soft_delete",
      entity: "notice",
      entityId: notice._id,
      message: "Notice deleted",
    });

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export { createNotice, getNotices, getMyNotices, getNoticeById, updateNotice, updateNoticeStatus, deleteNotice };
