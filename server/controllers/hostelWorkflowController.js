import Hostel from "../models/Hostel.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelBed from "../models/HostelBed.js";
import HostelComplaint from "../models/HostelComplaint.js";
import HostelOutpass from "../models/HostelOutpass.js";
import HostelRoom from "../models/HostelRoom.js";
import Student from "../models/Student.js";
import StaffMember from "../models/StaffMember.js";
import createAuditLog from "../utils/audit.js";
import { ensureParentStudentAccess, getStudentProfileForUser } from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { createNotification, getParentUserIdsForStudent } from "../utils/notificationUtils.js";

const allocationPopulate = [
  {
    path: "studentId",
    populate: [
      { path: "academicGroupId", select: "className section department course semester year batch" },
    ],
  },
  { path: "hostelId", populate: [{ path: "wardenId", select: "name email phone designation staffId status" }] },
  { path: "roomId", select: "roomNumber floorNumber roomType capacity occupiedBeds status" },
  { path: "bedId", select: "bedNumber status allocatedStudentId" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const outpassPopulate = [
  {
    path: "studentId",
  },
  {
    path: "hostelAllocationId",
    populate: [
      { path: "hostelId", select: "hostelName hostelCode hostelType" },
      { path: "roomId", select: "roomNumber floorNumber" },
      { path: "bedId", select: "bedNumber" },
    ],
  },
  { path: "parentApprovedBy", select: "name email role relation" },
  { path: "wardenApprovedBy", select: "name email role designation" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const complaintPopulate = [
  {
    path: "studentId",
  },
  {
    path: "hostelAllocationId",
    populate: [
      { path: "hostelId", select: "hostelName hostelCode hostelType" },
      { path: "roomId", select: "roomNumber floorNumber" },
      { path: "bedId", select: "bedNumber" },
    ],
  },
  { path: "assignedTo", select: "name email role designation staffId" },
  { path: "resolvedBy", select: "name email role designation" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const syncRoomOccupancy = async (roomId) => {
  const room = await HostelRoom.findById(roomId);
  if (!room || room.isDeleted) {
    return;
  }

  const occupiedBeds = await HostelBed.countDocuments({
    roomId: room._id,
    isDeleted: false,
    status: "occupied",
  });

  room.occupiedBeds = occupiedBeds;
  if (!["maintenance", "inactive"].includes(room.status)) {
    room.status = occupiedBeds >= room.capacity ? "full" : "available";
  }

  await room.save();
};

const serializeAllocation = (allocation) => ({
  _id: allocation._id,
  instituteId: allocation.instituteId,
  studentId: allocation.studentId,
  hostelId: allocation.hostelId,
  roomId: allocation.roomId,
  bedId: allocation.bedId,
  allocationDate: allocation.allocationDate,
  leavingDate: allocation.leavingDate,
  monthlyFee: allocation.monthlyFee,
  securityDeposit: allocation.securityDeposit,
  status: allocation.status,
  remarks: allocation.remarks,
  createdBy: allocation.createdBy,
  updatedBy: allocation.updatedBy,
  createdAt: allocation.createdAt,
  updatedAt: allocation.updatedAt,
});

const serializeOutpass = (outpass) => ({
  _id: outpass._id,
  instituteId: outpass.instituteId,
  studentId: outpass.studentId,
  hostelAllocationId: outpass.hostelAllocationId,
  reason: outpass.reason,
  destination: outpass.destination,
  fromDate: outpass.fromDate,
  toDate: outpass.toDate,
  parentApprovalRequired: outpass.parentApprovalRequired,
  parentApprovalStatus: outpass.parentApprovalStatus,
  parentApprovedBy: outpass.parentApprovedBy,
  parentApprovedAt: outpass.parentApprovedAt,
  wardenApprovalStatus: outpass.wardenApprovalStatus,
  wardenApprovedBy: outpass.wardenApprovedBy,
  wardenApprovedAt: outpass.wardenApprovedAt,
  finalStatus: outpass.finalStatus,
  remarks: outpass.remarks,
  createdBy: outpass.createdBy,
  updatedBy: outpass.updatedBy,
  createdAt: outpass.createdAt,
  updatedAt: outpass.updatedAt,
});

const serializeComplaint = (complaint) => ({
  _id: complaint._id,
  instituteId: complaint.instituteId,
  studentId: complaint.studentId,
  hostelAllocationId: complaint.hostelAllocationId,
  complaintType: complaint.complaintType,
  title: complaint.title,
  description: complaint.description,
  priority: complaint.priority,
  assignedTo: complaint.assignedTo,
  status: complaint.status,
  resolutionNote: complaint.resolutionNote,
  resolvedBy: complaint.resolvedBy,
  resolvedAt: complaint.resolvedAt,
  createdBy: complaint.createdBy,
  updatedBy: complaint.updatedBy,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
});

const populateAllocationById = async (id) => {
  const allocation = await HostelAllocation.findById(id).populate(allocationPopulate);
  return allocation
    ? {
        ...serializeAllocation(allocation),
        student: allocation.studentId,
        hostel: allocation.hostelId,
        room: allocation.roomId,
        bed: allocation.bedId,
      }
    : null;
};

const populateOutpassById = async (id) => {
  const outpass = await HostelOutpass.findById(id).populate(outpassPopulate);
  return outpass
    ? {
        ...serializeOutpass(outpass),
        student: outpass.studentId,
        hostelAllocation: outpass.hostelAllocationId,
      }
    : null;
};

const populateComplaintById = async (id) => {
  const complaint = await HostelComplaint.findById(id).populate(complaintPopulate);
  return complaint
    ? {
        ...serializeComplaint(complaint),
        student: complaint.studentId,
        hostelAllocation: complaint.hostelAllocationId,
        assignedStaff: complaint.assignedTo,
      }
    : null;
};

const getActiveStudentAllocation = async (studentId, instituteId) =>
  HostelAllocation.findOne({
    studentId,
    instituteId,
    isDeleted: false,
    status: "active",
  });

const validateAllocationEntities = async ({ instituteId, studentId, hostelId, roomId, bedId }) => {
  const [student, hostel, room, bed] = await Promise.all([
    Student.findOne({ _id: studentId, instituteId, isDeleted: false }),
    Hostel.findOne({ _id: hostelId, instituteId, isDeleted: false }),
    HostelRoom.findOne({ _id: roomId, instituteId, hostelId, isDeleted: false }),
    HostelBed.findOne({ _id: bedId, instituteId, hostelId, roomId, isDeleted: false }),
  ]);

  if (!student) throw new Error("Student not found for this institute");
  if (!hostel) throw new Error("Hostel not found for this institute");
  if (!room) throw new Error("Room not found for this hostel");
  if (!bed) throw new Error("Bed not found for this room");

  return { student, hostel, room, bed };
};

const releaseAllocationResources = async (allocation) => {
  const bed = await HostelBed.findOne({ _id: allocation.bedId, isDeleted: false });
  if (bed) {
    bed.status = "available";
    bed.allocatedStudentId = null;
    await bed.save();
    await syncRoomOccupancy(bed.roomId);
  }
};

const applyAllocationResources = async ({ bedId, studentId }) => {
  const bed = await HostelBed.findOne({ _id: bedId, isDeleted: false });
  if (!bed) {
    throw new Error("Bed not found");
  }
  bed.status = "occupied";
  bed.allocatedStudentId = studentId;
  await bed.save();
  await syncRoomOccupancy(bed.roomId);
};

const getAllocationSupportData = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const [students, hostels, rooms, beds] = await Promise.all([
      Student.find({ instituteId, isDeleted: false, status: "active" })
        .populate("academicGroupId", "className section department course semester year batch")
        .sort({ createdAt: -1 }),
      Hostel.find({ instituteId, isDeleted: false, status: { $ne: "inactive" } }).sort({ hostelName: 1 }),
      HostelRoom.find({ instituteId, isDeleted: false, status: { $in: ["available", "full"] } }).sort({ createdAt: -1 }),
      HostelBed.find({ instituteId, isDeleted: false, status: "available" }).sort({ createdAt: -1 }),
    ]);

    res.json({ students, hostels, rooms, beds });
  } catch (error) {
    next(error);
  }
};

const createHostelAllocation = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const {
      studentId,
      hostelId,
      roomId,
      bedId,
      allocationDate,
      monthlyFee = 0,
      securityDeposit = 0,
      remarks = "",
    } = req.body;

    if (!studentId || !hostelId || !roomId || !bedId || !allocationDate) {
      res.status(400);
      throw new Error("Student, hostel, room, bed, and allocation date are required");
    }

    const activeAllocation = await getActiveStudentAllocation(studentId, instituteId);
    if (activeAllocation) {
      res.status(409);
      throw new Error("Student already has an active hostel allocation");
    }

    const { bed } = await validateAllocationEntities({ instituteId, studentId, hostelId, roomId, bedId });
    if (bed.status !== "available") {
      res.status(400);
      throw new Error("Bed must be available for allocation");
    }

    const allocation = await HostelAllocation.create({
      instituteId,
      studentId,
      hostelId,
      roomId,
      bedId,
      allocationDate,
      monthlyFee: Number(monthlyFee || 0),
      securityDeposit: Number(securityDeposit || 0),
      remarks: remarks?.trim() || "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await applyAllocationResources({ bedId, studentId });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "hostel_allocation",
      entityId: allocation._id,
      message: "Hostel allocation created",
    });

    res.status(201).json({
      message: "Hostel allocation created successfully",
      allocation: await populateAllocationById(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelAllocations = async (req, res, next) => {
  try {
    const query = {
      instituteId: getScopedInstituteId(req, true),
      isDeleted: false,
    };
    if (req.query.studentId && req.query.studentId !== "all") query.studentId = req.query.studentId;
    if (req.query.hostelId && req.query.hostelId !== "all") query.hostelId = req.query.hostelId;
    if (req.query.roomId && req.query.roomId !== "all") query.roomId = req.query.roomId;
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;

    const allocations = await HostelAllocation.find(query).populate(allocationPopulate).sort({ createdAt: -1 });
    const search = req.query.search?.trim().toLowerCase();
    const filtered = !search
      ? allocations
      : allocations.filter((allocation) => {
          const studentName = allocation.studentId?.userId?.name?.toLowerCase() || "";
          return (
            studentName.includes(search) ||
            allocation.hostelId?.hostelName?.toLowerCase().includes(search) ||
            allocation.roomId?.roomNumber?.toLowerCase().includes(search) ||
            allocation.bedId?.bedNumber?.toLowerCase().includes(search)
          );
        });

    res.json({
      allocations: filtered.map((allocation) => ({
        ...serializeAllocation(allocation),
        student: allocation.studentId,
        hostel: allocation.hostelId,
        room: allocation.roomId,
        bed: allocation.bedId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelAllocationById = async (req, res, next) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, isDeleted: false }).populate(allocationPopulate);
    if (!allocation) {
      res.status(404);
      throw new Error("Hostel allocation not found");
    }
    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel allocation");
    }

    res.json({
      allocation: {
        ...serializeAllocation(allocation),
        student: allocation.studentId,
        hostel: allocation.hostelId,
        room: allocation.roomId,
        bed: allocation.bedId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelAllocation = async (req, res, next) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Hostel allocation not found");
    }
    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel allocation");
    }

    Object.assign(allocation, {
      leavingDate: req.body.leavingDate !== undefined ? req.body.leavingDate || null : allocation.leavingDate,
      monthlyFee: req.body.monthlyFee !== undefined ? Number(req.body.monthlyFee || 0) : allocation.monthlyFee,
      securityDeposit:
        req.body.securityDeposit !== undefined ? Number(req.body.securityDeposit || 0) : allocation.securityDeposit,
      remarks: req.body.remarks !== undefined ? req.body.remarks?.trim() || "" : allocation.remarks,
      updatedBy: req.user._id,
    });

    await allocation.save();

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "update",
      entity: "hostel_allocation",
      entityId: allocation._id,
      message: "Hostel allocation updated",
    });

    res.json({
      message: "Hostel allocation updated successfully",
      allocation: await populateAllocationById(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const leaveHostelAllocation = async (req, res, next) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Hostel allocation not found");
    }
    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel allocation");
    }
    if (allocation.status !== "active") {
      res.status(400);
      throw new Error("Only active allocation can be marked as left");
    }

    allocation.status = "left";
    allocation.leavingDate = req.body.leavingDate || new Date();
    allocation.remarks = req.body.remarks?.trim() || allocation.remarks;
    allocation.updatedBy = req.user._id;
    await allocation.save();
    await releaseAllocationResources(allocation);

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "left",
      entity: "hostel_allocation",
      entityId: allocation._id,
      message: "Hostel allocation marked left",
    });

    res.json({
      message: "Hostel allocation marked as left",
      allocation: await populateAllocationById(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const cancelHostelAllocation = async (req, res, next) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Hostel allocation not found");
    }
    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel allocation");
    }
    if (allocation.status !== "active") {
      res.status(400);
      throw new Error("Only active allocation can be cancelled");
    }

    allocation.status = "cancelled";
    allocation.remarks = req.body.remarks?.trim() || allocation.remarks;
    allocation.updatedBy = req.user._id;
    await allocation.save();
    await releaseAllocationResources(allocation);

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "cancel",
      entity: "hostel_allocation",
      entityId: allocation._id,
      message: "Hostel allocation cancelled",
    });

    res.json({
      message: "Hostel allocation cancelled successfully",
      allocation: await populateAllocationById(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostelAllocation = async (req, res, next) => {
  try {
    const allocation = await HostelAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Hostel allocation not found");
    }
    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel allocation");
    }
    if (allocation.status === "active") {
      await releaseAllocationResources(allocation);
    }
    allocation.isDeleted = true;
    allocation.deletedAt = new Date();
    allocation.updatedBy = req.user._id;
    await allocation.save();

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "soft_delete",
      entity: "hostel_allocation",
      entityId: allocation._id,
      message: "Hostel allocation deleted",
    });

    res.json({ message: "Hostel allocation deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getMyHostelAllocation = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const allocation = await HostelAllocation.findOne({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
      status: "active",
    }).populate(allocationPopulate);

    res.json({
      allocation: allocation
        ? {
            ...serializeAllocation(allocation),
            student: allocation.studentId,
            hostel: allocation.hostelId,
            room: allocation.roomId,
            bed: allocation.bedId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getChildHostelAllocation = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }
    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    const allocation = await HostelAllocation.findOne({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
      status: "active",
    }).populate(allocationPopulate);

    res.json({
      allocation: allocation
        ? {
            ...serializeAllocation(allocation),
            student: allocation.studentId,
            hostel: allocation.hostelId,
            room: allocation.roomId,
            bed: allocation.bedId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentHostelAllocations = async (req, res, next) => {
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

    const allocations = await HostelAllocation.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    }).populate(allocationPopulate);

    res.json({
      allocations: allocations.map((allocation) => ({
        ...serializeAllocation(allocation),
        student: allocation.studentId,
        hostel: allocation.hostelId,
        room: allocation.roomId,
        bed: allocation.bedId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const createHostelOutpass = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const allocation = await getActiveStudentAllocation(student._id, student.instituteId);
    if (!allocation) {
      res.status(400);
      throw new Error("Active hostel allocation is required to request outpass");
    }

    const {
      reason,
      destination,
      fromDate,
      toDate,
      parentApprovalRequired = true,
      remarks = "",
    } = req.body;

    if (!reason?.trim() || !destination?.trim() || !fromDate || !toDate) {
      res.status(400);
      throw new Error("Reason, destination, from date, and to date are required");
    }

    if (new Date(toDate) < new Date(fromDate)) {
      res.status(400);
      throw new Error("To date must be greater than or equal to from date");
    }

    const outpass = await HostelOutpass.create({
      instituteId: student.instituteId,
      studentId: student._id,
      hostelAllocationId: allocation._id,
      reason: reason.trim(),
      destination: destination.trim(),
      fromDate,
      toDate,
      parentApprovalRequired: Boolean(parentApprovalRequired),
      parentApprovalStatus: parentApprovalRequired ? "pending" : "not_required",
      finalStatus: "pending",
      remarks: remarks?.trim() || "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "create",
      entity: "hostel_outpass",
      entityId: outpass._id,
      message: "Hostel outpass created",
    });

    res.status(201).json({
      message: "Hostel outpass request created successfully",
      outpass: await populateOutpassById(outpass._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelOutpasses = async (req, res, next) => {
  try {
    const query = {
      instituteId: getScopedInstituteId(req, true),
      isDeleted: false,
    };
    if (req.query.studentId && req.query.studentId !== "all") query.studentId = req.query.studentId;
    if (req.query.finalStatus && req.query.finalStatus !== "all") query.finalStatus = req.query.finalStatus;
    if (req.query.fromDate || req.query.toDate) {
      query.fromDate = {};
      if (req.query.fromDate) query.fromDate.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) query.fromDate.$lte = new Date(req.query.toDate);
    }

    const outpasses = await HostelOutpass.find(query).populate(outpassPopulate).sort({ createdAt: -1 });
    const filtered = req.query.hostelId && req.query.hostelId !== "all"
      ? outpasses.filter(
          (entry) => String(entry.hostelAllocationId?.hostelId?._id || entry.hostelAllocationId?.hostelId) === String(req.query.hostelId)
        )
      : outpasses;

    res.json({
      outpasses: filtered.map((outpass) => ({
        ...serializeOutpass(outpass),
        student: outpass.studentId,
        hostelAllocation: outpass.hostelAllocationId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelOutpassById = async (req, res, next) => {
  try {
    const outpass = await HostelOutpass.findOne({ _id: req.params.id, isDeleted: false }).populate(outpassPopulate);
    if (!outpass) {
      res.status(404);
      throw new Error("Hostel outpass not found");
    }

    const student = await Student.findOne({ _id: outpass.studentId, isDeleted: false });
    const isLinkedParent = req.user.role === "parent" ? await ensureParentStudentAccess(req, student?._id) : false;
    const isOwnStudent = req.user.role === "student" && String(student?.userId) === String(req.user._id);
    const isManagerScope = ["admin", "staff", "superadmin"].includes(req.user.role) && ensureInstituteScope(req, outpass.instituteId);

    if (!(isOwnStudent || isLinkedParent || isManagerScope)) {
      res.status(403);
      throw new Error("Access denied for this hostel outpass");
    }

    res.json({
      outpass: {
        ...serializeOutpass(outpass),
        student: outpass.studentId,
        hostelAllocation: outpass.hostelAllocationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyHostelOutpasses = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const outpasses = await HostelOutpass.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    }).populate(outpassPopulate);

    res.json({
      outpasses: outpasses.map((outpass) => ({
        ...serializeOutpass(outpass),
        student: outpass.studentId,
        hostelAllocation: outpass.hostelAllocationId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getChildHostelOutpasses = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }
    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    const outpasses = await HostelOutpass.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    }).populate(outpassPopulate);

    res.json({
      outpasses: outpasses.map((outpass) => ({
        ...serializeOutpass(outpass),
        student: outpass.studentId,
        hostelAllocation: outpass.hostelAllocationId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const updateParentApproval = async (req, res, next) => {
  try {
    const outpass = await HostelOutpass.findOne({ _id: req.params.id, isDeleted: false });
    if (!outpass) {
      res.status(404);
      throw new Error("Hostel outpass not found");
    }
    const hasAccess = await ensureParentStudentAccess(req, outpass.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this outpass");
    }
    if (!outpass.parentApprovalRequired) {
      res.status(400);
      throw new Error("Parent approval is not required for this outpass");
    }
    if (outpass.finalStatus === "cancelled") {
      res.status(400);
      throw new Error("Cancelled outpass cannot be approved");
    }

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Parent approval status must be approved or rejected");
    }

    outpass.parentApprovalStatus = status;
    outpass.parentApprovedBy = req.user._id;
    outpass.parentApprovedAt = new Date();
    outpass.updatedBy = req.user._id;
    outpass.finalStatus = status === "approved" ? "parent_approved" : "rejected";
    await outpass.save();

    // Notify student when parent approves/rejects outpass
    const student = await Student.findById(outpass.studentId).select("userId");
    if (student) {
      await createNotification({
        instituteId: outpass.instituteId,
        recipientUserId: student.userId,
        title: `Outpass ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your parent has ${status} your outpass request for ${outpass.destination} from ${new Date(outpass.fromDate).toLocaleDateString()} to ${new Date(outpass.toDate).toLocaleDateString()}`,
        type: "hostel",
        link: `/student/hostel/outpasses`,
        priority: status === "rejected" ? "high" : "normal",
        createdBy: req.user._id,
        metadata: { outpassId: outpass._id },
      });
    }

    await createAuditLog({
      req,
      instituteId: outpass.instituteId,
      action: status === "approved" ? "parent_approved" : "parent_rejected",
      entity: "hostel_outpass",
      entityId: outpass._id,
      message: `Hostel outpass parent ${status}`,
    });

    res.json({
      message: `Parent ${status} the outpass successfully`,
      outpass: await populateOutpassById(outpass._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateWardenApproval = async (req, res, next) => {
  try {
    const outpass = await HostelOutpass.findOne({ _id: req.params.id, isDeleted: false });
    if (!outpass) {
      res.status(404);
      throw new Error("Hostel outpass not found");
    }
    if (!ensureInstituteScope(req, outpass.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this outpass");
    }

    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Warden approval status must be approved or rejected");
    }
    if (outpass.parentApprovalRequired && outpass.parentApprovalStatus !== "approved" && status === "approved") {
      res.status(400);
      throw new Error("Parent approval is required before warden approval");
    }

    outpass.wardenApprovalStatus = status;
    outpass.wardenApprovedBy = req.user._id;
    outpass.wardenApprovedAt = new Date();
    outpass.remarks = remarks?.trim() || outpass.remarks;
    outpass.updatedBy = req.user._id;
    outpass.finalStatus = status === "approved" ? "approved" : "rejected";
    await outpass.save();

    // Notify student when warden approves/rejects outpass
    const student = await Student.findById(outpass.studentId).select("userId");
    if (student) {
      await createNotification({
        instituteId: outpass.instituteId,
        recipientUserId: student.userId,
        title: `Outpass ${status.charAt(0).toUpperCase() + status.slice(1)} by Warden`,
        message: `The warden has ${status} your outpass request for ${outpass.destination} from ${new Date(outpass.fromDate).toLocaleDateString()} to ${new Date(outpass.toDate).toLocaleDateString()}${remarks ? `. Remarks: ${remarks}` : ""}`,
        type: "hostel",
        link: `/student/hostel/outpasses`,
        priority: status === "rejected" ? "high" : "normal",
        createdBy: req.user._id,
        metadata: { outpassId: outpass._id },
      });
    }

    await createAuditLog({
      req,
      instituteId: outpass.instituteId,
      action: status === "approved" ? "warden_approved" : "warden_rejected",
      entity: "hostel_outpass",
      entityId: outpass._id,
      message: `Hostel outpass warden ${status}`,
    });

    res.json({
      message: `Warden ${status} the outpass successfully`,
      outpass: await populateOutpassById(outpass._id),
    });
  } catch (error) {
    next(error);
  }
};

const cancelHostelOutpass = async (req, res, next) => {
  try {
    const outpass = await HostelOutpass.findOne({ _id: req.params.id, isDeleted: false });
    if (!outpass) {
      res.status(404);
      throw new Error("Hostel outpass not found");
    }
    const student = await Student.findOne({ _id: outpass.studentId, isDeleted: false });
    if (!student || String(student.userId) !== String(req.user._id)) {
      res.status(403);
      throw new Error("You can cancel only your own outpass");
    }
    if (!["pending", "parent_approved"].includes(outpass.finalStatus)) {
      res.status(400);
      throw new Error("Only pending outpass can be cancelled");
    }

    outpass.finalStatus = "cancelled";
    outpass.updatedBy = req.user._id;
    await outpass.save();

    await createAuditLog({
      req,
      instituteId: outpass.instituteId,
      action: "cancel",
      entity: "hostel_outpass",
      entityId: outpass._id,
      message: "Hostel outpass cancelled",
    });

    res.json({
      message: "Hostel outpass cancelled successfully",
      outpass: await populateOutpassById(outpass._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostelOutpass = async (req, res, next) => {
  try {
    const outpass = await HostelOutpass.findOne({ _id: req.params.id, isDeleted: false });
    if (!outpass) {
      res.status(404);
      throw new Error("Hostel outpass not found");
    }
    if (!ensureInstituteScope(req, outpass.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this outpass");
    }
    outpass.isDeleted = true;
    outpass.deletedAt = new Date();
    outpass.updatedBy = req.user._id;
    await outpass.save();

    await createAuditLog({
      req,
      instituteId: outpass.instituteId,
      action: "soft_delete",
      entity: "hostel_outpass",
      entityId: outpass._id,
      message: "Hostel outpass deleted",
    });

    res.json({ message: "Hostel outpass deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createHostelComplaint = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const allocation = await getActiveStudentAllocation(student._id, student.instituteId);
    if (!allocation) {
      res.status(400);
      throw new Error("Active hostel allocation is required to raise complaint");
    }

    const { complaintType, title, description, priority = "normal" } = req.body;
    if (!complaintType || !title?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error("Complaint type, title, and description are required");
    }

    const complaint = await HostelComplaint.create({
      instituteId: student.instituteId,
      studentId: student._id,
      hostelAllocationId: allocation._id,
      complaintType,
      title: title.trim(),
      description: description.trim(),
      priority,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "create",
      entity: "hostel_complaint",
      entityId: complaint._id,
      message: "Hostel complaint created",
    });

    res.status(201).json({
      message: "Hostel complaint created successfully",
      complaint: await populateComplaintById(complaint._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelComplaints = async (req, res, next) => {
  try {
    const query = {
      instituteId: getScopedInstituteId(req, true),
      isDeleted: false,
    };
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;
    if (req.query.priority && req.query.priority !== "all") query.priority = req.query.priority;
    if (req.query.complaintType && req.query.complaintType !== "all") query.complaintType = req.query.complaintType;
    if (req.query.studentId && req.query.studentId !== "all") query.studentId = req.query.studentId;

    const complaints = await HostelComplaint.find(query).populate(complaintPopulate).sort({ createdAt: -1 });
    const filtered = req.query.hostelId && req.query.hostelId !== "all"
      ? complaints.filter(
          (entry) => String(entry.hostelAllocationId?.hostelId?._id || entry.hostelAllocationId?.hostelId) === String(req.query.hostelId)
        )
      : complaints;

    res.json({
      complaints: filtered.map((complaint) => ({
        ...serializeComplaint(complaint),
        student: complaint.studentId,
        hostelAllocation: complaint.hostelAllocationId,
        assignedStaff: complaint.assignedTo,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelComplaintById = async (req, res, next) => {
  try {
    const complaint = await HostelComplaint.findOne({ _id: req.params.id, isDeleted: false }).populate(complaintPopulate);
    if (!complaint) {
      res.status(404);
      throw new Error("Hostel complaint not found");
    }

    const student = await Student.findOne({ _id: complaint.studentId, isDeleted: false });
    const isLinkedParent = req.user.role === "parent" ? await ensureParentStudentAccess(req, student?._id) : false;
    const isOwnStudent = req.user.role === "student" && String(student?.userId) === String(req.user._id);
    const isManagerScope = ["admin", "staff", "superadmin"].includes(req.user.role) && ensureInstituteScope(req, complaint.instituteId);

    if (!(isOwnStudent || isLinkedParent || isManagerScope)) {
      res.status(403);
      throw new Error("Access denied for this hostel complaint");
    }

    res.json({
      complaint: {
        ...serializeComplaint(complaint),
        student: complaint.studentId,
        hostelAllocation: complaint.hostelAllocationId,
        assignedStaff: complaint.assignedTo,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyHostelComplaints = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const complaints = await HostelComplaint.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    }).populate(complaintPopulate);

    res.json({
      complaints: complaints.map((complaint) => ({
        ...serializeComplaint(complaint),
        student: complaint.studentId,
        hostelAllocation: complaint.hostelAllocationId,
        assignedStaff: complaint.assignedTo,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getChildHostelComplaints = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }
    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    const complaints = await HostelComplaint.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    }).populate(complaintPopulate);

    res.json({
      complaints: complaints.map((complaint) => ({
        ...serializeComplaint(complaint),
        student: complaint.studentId,
        hostelAllocation: complaint.hostelAllocationId,
        assignedStaff: complaint.assignedTo,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const assignHostelComplaint = async (req, res, next) => {
  try {
    const complaint = await HostelComplaint.findOne({ _id: req.params.id, isDeleted: false });
    if (!complaint) {
      res.status(404);
      throw new Error("Hostel complaint not found");
    }
    if (!ensureInstituteScope(req, complaint.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this complaint");
    }

    const assignedTo = req.body.assignedTo || null;
    if (assignedTo) {
      const staff = await StaffMember.findOne({
        _id: assignedTo,
        instituteId: complaint.instituteId,
        isDeleted: false,
      });
      if (!staff) {
        res.status(400);
        throw new Error("Assigned staff not found for this institute");
      }
    }

    complaint.assignedTo = assignedTo;
    complaint.updatedBy = req.user._id;
    await complaint.save();

    await createAuditLog({
      req,
      instituteId: complaint.instituteId,
      action: "assign",
      entity: "hostel_complaint",
      entityId: complaint._id,
      message: "Hostel complaint assigned",
    });

    res.json({
      message: "Hostel complaint assigned successfully",
      complaint: await populateComplaintById(complaint._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelComplaintStatus = async (req, res, next) => {
  try {
    const complaint = await HostelComplaint.findOne({ _id: req.params.id, isDeleted: false });
    if (!complaint) {
      res.status(404);
      throw new Error("Hostel complaint not found");
    }
    if (!ensureInstituteScope(req, complaint.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this complaint");
    }

    const { status, resolutionNote } = req.body;
    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      res.status(400);
      throw new Error("Complaint status is invalid");
    }

    complaint.status = status;
    complaint.resolutionNote = resolutionNote?.trim() || complaint.resolutionNote;
    complaint.updatedBy = req.user._id;
    if (["resolved", "closed"].includes(status)) {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
    }
    await complaint.save();

    // Notify student when complaint is resolved/closed
    if (["resolved", "closed"].includes(status)) {
      const student = await Student.findById(complaint.studentId).select("userId");
      if (student) {
        await createNotification({
          instituteId: complaint.instituteId,
          recipientUserId: student.userId,
          title: `Complaint ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your complaint "${complaint.title}" has been ${status}${resolutionNote ? `. Resolution: ${resolutionNote}` : ""}`,
          type: "hostel",
          link: `/student/hostel/complaints`,
          priority: "normal",
          createdBy: req.user._id,
          metadata: { complaintId: complaint._id },
        });
      }
    }

    await createAuditLog({
      req,
      instituteId: complaint.instituteId,
      action: "status_update",
      entity: "hostel_complaint",
      entityId: complaint._id,
      message: `Hostel complaint marked ${status}`,
    });

    res.json({
      message: "Hostel complaint status updated successfully",
      complaint: await populateComplaintById(complaint._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostelComplaint = async (req, res, next) => {
  try {
    const complaint = await HostelComplaint.findOne({ _id: req.params.id, isDeleted: false });
    if (!complaint) {
      res.status(404);
      throw new Error("Hostel complaint not found");
    }
    if (!ensureInstituteScope(req, complaint.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this complaint");
    }
    complaint.isDeleted = true;
    complaint.deletedAt = new Date();
    complaint.updatedBy = req.user._id;
    await complaint.save();

    await createAuditLog({
      req,
      instituteId: complaint.instituteId,
      action: "soft_delete",
      entity: "hostel_complaint",
      entityId: complaint._id,
      message: "Hostel complaint deleted",
    });

    res.json({ message: "Hostel complaint deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAllocationSupportData,
  createHostelAllocation,
  getHostelAllocations,
  getMyHostelAllocation,
  getChildHostelAllocation,
  getStudentHostelAllocations,
  getHostelAllocationById,
  updateHostelAllocation,
  leaveHostelAllocation,
  cancelHostelAllocation,
  deleteHostelAllocation,
  createHostelOutpass,
  getHostelOutpasses,
  getMyHostelOutpasses,
  getChildHostelOutpasses,
  getHostelOutpassById,
  updateParentApproval,
  updateWardenApproval,
  cancelHostelOutpass,
  deleteHostelOutpass,
  createHostelComplaint,
  getHostelComplaints,
  getMyHostelComplaints,
  getChildHostelComplaints,
  getHostelComplaintById,
  assignHostelComplaint,
  updateHostelComplaintStatus,
  deleteHostelComplaint,
};
