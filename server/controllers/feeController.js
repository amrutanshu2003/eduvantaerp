import AcademicGroup from "../models/AcademicGroup.js";
import Fee from "../models/Fee.js";
import Student from "../models/Student.js";
import createAuditLog from "../utils/audit.js";
import { getFeeStatus, sanitizeFee } from "../utils/feeUtils.js";
import { ensureParentStudentAccess, getStudentProfileForUser } from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { createNotification, getParentUserIdsForStudent } from "../utils/notificationUtils.js";

const populateFee = (query) =>
  query
    .populate({
      path: "studentId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .populate("academicGroupId", "className section department course semester year")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const validateFeePayload = async (req, payload, existingFee = null) => {
  const instituteId = getScopedInstituteId(req, false);

  if (!payload.studentId || !payload.title?.trim() || payload.amount === undefined || !payload.dueDate) {
    return "Student, title, amount, and due date are required";
  }

  const student = await Student.findOne({
    _id: payload.studentId,
    instituteId,
    isDeleted: false,
  });

  if (!student) {
    return "Student not found for this institute";
  }

  if (payload.academicGroupId) {
    const academicGroup = await AcademicGroup.findOne({
      _id: payload.academicGroupId,
      instituteId,
      isDeleted: false,
    });

    if (!academicGroup) {
      return "Academic group not found for this institute";
    }
  }

  if (Number(payload.amount) < 0 || Number(payload.discount || 0) < 0 || Number(payload.fine || 0) < 0 || Number(payload.paidAmount || 0) < 0) {
    return "Amount, discount, fine, and paid amount must be zero or more";
  }

  if (existingFee && String(existingFee.studentId) !== String(student._id) && payload.academicGroupId === undefined) {
    payload.academicGroupId = student.academicGroupId || null;
  }

  return null;
};

const saveFee = async (fee) => {
  fee.status = getFeeStatus(fee);
  await fee.save();
};

const createFee = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const validationError = await validateFeePayload(req, req.body);

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const student = await Student.findOne({
      _id: req.body.studentId,
      instituteId,
      isDeleted: false,
    }).select("academicGroupId");

    const fee = new Fee({
      instituteId,
      studentId: req.body.studentId,
      academicGroupId: req.body.academicGroupId ?? student.academicGroupId ?? null,
      feeType: req.body.feeType || "tuition",
      title: req.body.title.trim(),
      description: req.body.description?.trim() || "",
      amount: Number(req.body.amount || 0),
      discount: Number(req.body.discount || 0),
      fine: Number(req.body.fine || 0),
      paidAmount: Number(req.body.paidAmount || 0),
      dueDate: req.body.dueDate,
      paymentDate: req.body.paymentDate || null,
      paymentMethod: req.body.paymentMethod || "none",
      transactionId: req.body.transactionId?.trim() || "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await saveFee(fee);

    // Notify student and parent when fee is created
    const studentForNotification = await Student.findById(fee.studentId).select("userId");
    if (studentForNotification) {
      const recipientUserIds = [studentForNotification.userId];
      const parentUserIds = await getParentUserIdsForStudent(fee.studentId);
      recipientUserIds.push(...parentUserIds);

      await createNotification({
        instituteId,
        recipientUserId: recipientUserIds,
        title: `New Fee: ${fee.title}`,
        message: `A new fee of ${fee.amount} has been created. Due date: ${new Date(fee.dueDate).toLocaleDateString()}`,
        type: "fees",
        link: `/student/fees`,
        priority: fee.dueDate && new Date(fee.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "high" : "normal",
        createdBy: req.user._id,
        metadata: { feeId: fee._id },
      });
    }

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "fee",
      entityId: fee._id,
      message: "Fee created",
    });

    res.status(201).json({ message: "Fee created successfully", fee: sanitizeFee(fee) });
  } catch (error) {
    next(error);
  }
};

const getFees = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };
    const statusFilter = req.query.status && req.query.status !== "all" ? req.query.status : null;

    if (req.query.studentId && req.query.studentId !== "all") {
      query.studentId = req.query.studentId;
    }
    if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
      query.academicGroupId = req.query.academicGroupId;
    }
    if (req.query.feeType && req.query.feeType !== "all") {
      query.feeType = req.query.feeType;
    }
    if (req.query.search?.trim()) {
      query.title = { $regex: req.query.search.trim(), $options: "i" };
    }

    const fees = await populateFee(Fee.find(query).sort({ dueDate: 1, createdAt: -1 }));
    const sanitizedFees = fees.map(sanitizeFee);

    res.json({
      fees: statusFilter ? sanitizedFees.filter((fee) => fee.status === statusFilter) : sanitizedFees,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFees = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);

    if (!student || !ensureInstituteScope(req, student.instituteId)) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const fees = await populateFee(
      Fee.find({
        instituteId: student.instituteId,
        studentId: student._id,
        isDeleted: false,
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    res.json({ fees: fees.map(sanitizeFee) });
  } catch (error) {
    next(error);
  }
};

const getFeesByStudentId = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({
      _id: req.params.studentId,
      instituteId,
      isDeleted: false,
    });

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const fees = await populateFee(
      Fee.find({
        instituteId,
        studentId: student._id,
        isDeleted: false,
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    res.json({ fees: fees.map(sanitizeFee), studentId: student._id });
  } catch (error) {
    next(error);
  }
};

const getChildFees = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);

    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({
      _id: req.params.studentId,
      instituteId,
      isDeleted: false,
    });

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const fees = await populateFee(
      Fee.find({
        instituteId,
        studentId: student._id,
        isDeleted: false,
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    res.json({ fees: fees.map(sanitizeFee), studentId: student._id });
  } catch (error) {
    next(error);
  }
};

const getFeeById = async (req, res, next) => {
  try {
    const fee = await populateFee(Fee.findOne({ _id: req.params.id, isDeleted: false }));

    if (!fee) {
      res.status(404);
      throw new Error("Fee not found");
    }

    if (!ensureInstituteScope(req, fee.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this fee");
    }

    res.json({ fee: sanitizeFee(fee) });
  } catch (error) {
    next(error);
  }
};

const updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, isDeleted: false });

    if (!fee) {
      res.status(404);
      throw new Error("Fee not found");
    }

    if (!ensureInstituteScope(req, fee.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this fee");
    }

    const mergedPayload = { ...fee.toObject(), ...req.body };
    const validationError = await validateFeePayload(req, mergedPayload, fee);

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const student = await Student.findOne({
      _id: req.body.studentId ?? fee.studentId,
      instituteId: fee.instituteId,
      isDeleted: false,
    }).select("academicGroupId");

    fee.studentId = req.body.studentId ?? fee.studentId;
    fee.academicGroupId = req.body.academicGroupId ?? student?.academicGroupId ?? fee.academicGroupId;
    fee.feeType = req.body.feeType ?? fee.feeType;
    fee.title = req.body.title?.trim() ?? fee.title;
    fee.description = req.body.description?.trim() ?? fee.description;
    fee.amount = req.body.amount !== undefined ? Number(req.body.amount) : fee.amount;
    fee.discount = req.body.discount !== undefined ? Number(req.body.discount) : fee.discount;
    fee.fine = req.body.fine !== undefined ? Number(req.body.fine) : fee.fine;
    fee.paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : fee.paidAmount;
    fee.dueDate = req.body.dueDate ?? fee.dueDate;
    fee.paymentDate = req.body.paymentDate === "" ? null : req.body.paymentDate ?? fee.paymentDate;
    fee.paymentMethod = req.body.paymentMethod ?? fee.paymentMethod;
    fee.transactionId = req.body.transactionId?.trim() ?? fee.transactionId;
    fee.updatedBy = req.user._id;

    await saveFee(fee);

    await createAuditLog({
      req,
      instituteId: fee.instituteId,
      action: "update",
      entity: "fee",
      entityId: fee._id,
      message: "Fee updated",
    });

    res.json({ message: "Fee updated successfully", fee: sanitizeFee(fee) });
  } catch (error) {
    next(error);
  }
};

const markFeePayment = async (req, res, next) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, isDeleted: false });

    if (!fee) {
      res.status(404);
      throw new Error("Fee not found");
    }

    if (!ensureInstituteScope(req, fee.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this fee");
    }

    if (req.body.paidAmount === undefined) {
      res.status(400);
      throw new Error("Paid amount is required");
    }

    fee.paidAmount = Number(req.body.paidAmount);
    fee.paymentDate = req.body.paymentDate || new Date();
    fee.paymentMethod = req.body.paymentMethod || fee.paymentMethod || "cash";
    fee.transactionId = req.body.transactionId?.trim() || fee.transactionId;
    fee.updatedBy = req.user._id;

    await saveFee(fee);

    // Notify student and parent when payment is marked
    const studentForPayment = await Student.findById(fee.studentId).select("userId");
    if (studentForPayment) {
      const recipientUserIds = [studentForPayment.userId];
      const parentUserIds = await getParentUserIdsForStudent(fee.studentId);
      recipientUserIds.push(...parentUserIds);

      await createNotification({
        instituteId: fee.instituteId,
        recipientUserId: recipientUserIds,
        title: `Payment Received: ${fee.title}`,
        message: `Payment of ${fee.paidAmount} has been recorded for ${fee.title}. Status: ${fee.status}`,
        type: "fees",
        link: `/student/fees`,
        priority: "success",
        createdBy: req.user._id,
        metadata: { feeId: fee._id },
      });
    }

    await createAuditLog({
      req,
      instituteId: fee.instituteId,
      action: "payment_update",
      entity: "fee",
      entityId: fee._id,
      message: "Fee payment updated",
    });

    res.json({ message: "Fee payment marked successfully", fee: sanitizeFee(fee) });
  } catch (error) {
    next(error);
  }
};

const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, isDeleted: false });

    if (!fee) {
      res.status(404);
      throw new Error("Fee not found");
    }

    if (!ensureInstituteScope(req, fee.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this fee");
    }

    fee.isDeleted = true;
    fee.deletedAt = new Date();
    fee.updatedBy = req.user._id;
    await fee.save();

    await createAuditLog({
      req,
      instituteId: fee.instituteId,
      action: "soft_delete",
      entity: "fee",
      entityId: fee._id,
      message: "Fee deleted",
    });

    res.json({ message: "Fee deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createFee,
  getFees,
  getMyFees,
  getFeesByStudentId,
  getChildFees,
  getFeeById,
  updateFee,
  markFeePayment,
  deleteFee,
};
