import StaffMember from "../models/StaffMember.js";
import createAuditLog from "../utils/audit.js";
import { getRecycleBinExpiryDate } from "../utils/recycleBin.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { ensureUniqueUserFields } from "../utils/uniqueFields.js";

const buildStaffQuery = (req) => {
  const query = { isDeleted: false };
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
      { staffId: { $regex: req.query.search.trim(), $options: "i" } },
      { designation: { $regex: req.query.search.trim(), $options: "i" } },
    ];
  }
  return query;
};

const createStaff = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const { name, email, phone, password, staffId, designation, department, joiningDate, salary, address, permissions = [], status = "active" } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !staffId?.trim() || !designation) {
      res.status(400);
      throw new Error("Name, email, password, staff ID, and designation are required");
    }

    await ensureUniqueUserFields({
      email,
      phone,
      staffId,
    });

    const staff = await StaffMember.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "staff",
      instituteId,
      staffId: staffId.trim(),
      designation,
      department: department?.trim() || "",
      joiningDate: joiningDate || null,
      salary: salary || null,
      address: address?.trim() || "",
      permissions,
      status,
      createdBy: req.user._id,
      createdByModel: req.user?.role === "superadmin" ? "SuperAdmin" : "Admin",
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "staff",
      entityId: staff._id,
      message: "Staff created",
    });

    res.status(201).json({ message: "Staff created successfully", staff: serializeUser(staff) });
  } catch (error) {
    next(error);
  }
};

const getStaffMembers = async (req, res, next) => {
  try {
    const staffMembers = await StaffMember.find(buildStaffQuery(req)).select("-password").sort({ createdAt: -1 });
    res.json({ staff: staffMembers.map(serializeUser) });
  } catch (error) {
    next(error);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const staff = await StaffMember.findOne({ _id: req.params.id, isDeleted: false }).select("-password");
    if (!staff) {
      res.status(404);
      throw new Error("Staff not found");
    }

    if (!ensureInstituteScope(req, staff.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this staff member");
    }

    res.json({ staff: serializeUser(staff) });
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const staff = await StaffMember.findOne({ _id: req.params.id, isDeleted: false }).select("+password");
    if (!staff) {
      res.status(404);
      throw new Error("Staff not found");
    }

    if (!ensureInstituteScope(req, staff.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this staff member");
    }

    await ensureUniqueUserFields({
      email: req.body.email ?? staff.email,
      phone: req.body.phone ?? staff.phone,
      staffId: req.body.staffId ?? staff.staffId,
      excludeUserId: staff._id,
    });

    Object.assign(staff, {
      name: req.body.name?.trim() ?? staff.name,
      email: req.body.email?.trim().toLowerCase() ?? staff.email,
      phone: req.body.phone?.trim() ?? staff.phone,
      staffId: req.body.staffId?.trim() ?? staff.staffId,
      designation: req.body.designation ?? staff.designation,
      department: req.body.department?.trim() ?? staff.department,
      joiningDate: req.body.joiningDate ?? staff.joiningDate,
      salary: req.body.salary ?? staff.salary,
      address: req.body.address?.trim() ?? staff.address,
      permissions: req.body.permissions ?? staff.permissions,
      status: req.body.status ?? staff.status,
    });

    if (req.body.password?.trim()) {
      staff.password = req.body.password.trim();
    }

    await staff.save();

    await createAuditLog({
      req,
      instituteId: staff.instituteId,
      action: "update",
      entity: "staff",
      entityId: staff._id,
      message: "Staff updated",
    });

    res.json({ message: "Staff updated successfully", staff: serializeUser(staff) });
  } catch (error) {
    next(error);
  }
};

const updateStaffStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const staff = await StaffMember.findOne({ _id: req.params.id, isDeleted: false });
    if (!staff) {
      res.status(404);
      throw new Error("Staff not found");
    }

    if (!ensureInstituteScope(req, staff.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this staff member");
    }

    staff.status = status;
    await staff.save();

    await createAuditLog({
      req,
      instituteId: staff.instituteId,
      action: "status_update",
      entity: "staff",
      entityId: staff._id,
      message: `Staff marked ${status}`,
    });

    res.json({ message: "Staff status updated successfully", staff: serializeUser(staff) });
  } catch (error) {
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const staff = await StaffMember.findOne({ _id: req.params.id, isDeleted: false });
    if (!staff) {
      res.status(404);
      throw new Error("Staff not found");
    }

    if (!ensureInstituteScope(req, staff.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this staff member");
    }

    staff.isDeleted = true;
    staff.deletedAt = new Date();
    staff.recycleBinExpiresAt = getRecycleBinExpiryDate(staff.deletedAt);
    staff.status = "inactive";
    await staff.save();

    await createAuditLog({
      req,
      instituteId: staff.instituteId,
      action: "soft_delete",
      entity: "staff",
      entityId: staff._id,
      message: "Staff deleted",
    });

    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const updateStaffPermissions = async (req, res, next) => {
  try {
    const staff = await StaffMember.findOne({ _id: req.params.id, isDeleted: false });
    if (!staff) {
      res.status(404);
      throw new Error("Staff not found");
    }

    if (!ensureInstituteScope(req, staff.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this staff member");
    }

    staff.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
    await staff.save();

    await createAuditLog({
      req,
      instituteId: staff.instituteId,
      action: "permissions_update",
      entity: "staff",
      entityId: staff._id,
      message: "Staff permissions updated",
    });

    res.json({ message: "Staff permissions updated successfully", staff: serializeUser(staff) });
  } catch (error) {
    next(error);
  }
};

export {
  createStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  updateStaffPermissions,
};
