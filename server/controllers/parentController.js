import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import createAuditLog from "../utils/audit.js";
import { getRecycleBinExpiryDate } from "../utils/recycleBin.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { ensureUniqueUserFields } from "../utils/uniqueFields.js";

const buildParentQuery = (req) => {
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
      { phone: { $regex: req.query.search.trim(), $options: "i" } },
    ];
  }
  return query;
};

const createParent = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const { name, email, phone, password, relation, linkedStudentIds = [], address = "", status = "active" } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !relation) {
      res.status(400);
      throw new Error("Name, email, password, and relation are required");
    }

    await ensureUniqueUserFields({
      email,
      phone,
    });

    if (linkedStudentIds.length > 0) {
      const students = await Student.find({
        _id: { $in: linkedStudentIds },
        instituteId,
        isDeleted: false,
      });
      if (students.length !== linkedStudentIds.length) {
        res.status(400);
        throw new Error("One or more linked students are invalid");
      }
    }

    const parent = await Parent.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "parent",
      instituteId,
      relation,
      linkedStudentIds,
      address: address.trim(),
      status,
      createdBy: req.user._id,
      createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "parent",
      entityId: parent._id,
      message: "Parent created",
    });

    res.status(201).json({
      message: "Parent created successfully",
      parent: serializeUser(parent),
    });
  } catch (error) {
    next(error);
  }
};

const getParents = async (req, res, next) => {
  try {
    const parents = await Parent.find(buildParentQuery(req))
      .select("-password")
      .populate("linkedStudentIds", "rollNumber admissionNumber name email phone");

    res.json({ parents: parents.map(serializeUser) });
  } catch (error) {
    next(error);
  }
};

const getParentById = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, isDeleted: false })
      .select("-password")
      .populate("linkedStudentIds", "rollNumber admissionNumber name email phone");

    if (!parent) {
      res.status(404);
      throw new Error("Parent not found");
    }

    if (!ensureInstituteScope(req, parent.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this parent");
    }

    res.json({ parent: serializeUser(parent) });
  } catch (error) {
    next(error);
  }
};

const updateParent = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, isDeleted: false }).select("+password");
    if (!parent) {
      res.status(404);
      throw new Error("Parent not found");
    }

    if (!ensureInstituteScope(req, parent.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this parent");
    }

    await ensureUniqueUserFields({
      email: req.body.email ?? parent.email,
      phone: req.body.phone ?? parent.phone,
      excludeUserId: parent._id,
    });

    if (Array.isArray(req.body.linkedStudentIds) && req.body.linkedStudentIds.length > 0) {
      const students = await Student.find({
        _id: { $in: req.body.linkedStudentIds },
        instituteId: parent.instituteId,
        isDeleted: false,
      });
      if (students.length !== req.body.linkedStudentIds.length) {
        res.status(400);
        throw new Error("One or more linked students are invalid");
      }
    }

    Object.assign(parent, {
      name: req.body.name?.trim() ?? parent.name,
      email: req.body.email?.trim().toLowerCase() ?? parent.email,
      phone: req.body.phone?.trim() ?? parent.phone,
      relation: req.body.relation ?? parent.relation,
      linkedStudentIds: req.body.linkedStudentIds ?? parent.linkedStudentIds,
      address: req.body.address?.trim() ?? parent.address,
      status: req.body.status ?? parent.status,
    });

    if (req.body.password?.trim()) {
      parent.password = req.body.password.trim();
    }

    await parent.save();

    await createAuditLog({
      req,
      instituteId: parent.instituteId,
      action: "update",
      entity: "parent",
      entityId: parent._id,
      message: "Parent updated",
    });

    res.json({ message: "Parent updated successfully", parent: serializeUser(parent) });
  } catch (error) {
    next(error);
  }
};

const updateParentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const parent = await Parent.findOne({ _id: req.params.id, isDeleted: false });
    if (!parent) {
      res.status(404);
      throw new Error("Parent not found");
    }

    if (!ensureInstituteScope(req, parent.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this parent");
    }

    parent.status = status;
    await parent.save();

    await createAuditLog({
      req,
      instituteId: parent.instituteId,
      action: "status_update",
      entity: "parent",
      entityId: parent._id,
      message: `Parent marked ${status}`,
    });

    res.json({ message: "Parent status updated successfully", parent: serializeUser(parent) });
  } catch (error) {
    next(error);
  }
};

const deleteParent = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, isDeleted: false });
    if (!parent) {
      res.status(404);
      throw new Error("Parent not found");
    }

    if (!ensureInstituteScope(req, parent.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this parent");
    }

    parent.isDeleted = true;
    parent.deletedAt = new Date();
    parent.recycleBinExpiresAt = getRecycleBinExpiryDate(parent.deletedAt);
    parent.status = "inactive";
    await parent.save();

    await createAuditLog({
      req,
      instituteId: parent.instituteId,
      action: "soft_delete",
      entity: "parent",
      entityId: parent._id,
      message: "Parent deleted",
    });

    res.json({ message: "Parent deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const linkStudentsToParent = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, isDeleted: false });
    if (!parent) {
      res.status(404);
      throw new Error("Parent not found");
    }

    if (!ensureInstituteScope(req, parent.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this parent");
    }

    const linkedStudentIds = Array.isArray(req.body.linkedStudentIds) ? req.body.linkedStudentIds : [];
    const students = await Student.find({
      _id: { $in: linkedStudentIds },
      instituteId: parent.instituteId,
      isDeleted: false,
    });
    if (students.length !== linkedStudentIds.length) {
      res.status(400);
      throw new Error("One or more linked students are invalid");
    }

    parent.linkedStudentIds = linkedStudentIds;
    await parent.save();

    await createAuditLog({
      req,
      instituteId: parent.instituteId,
      action: "link_students",
      entity: "parent",
      entityId: parent._id,
      message: "Students linked to parent",
    });

    res.json({ message: "Students linked successfully", parent: serializeUser(parent) });
  } catch (error) {
    next(error);
  }
};

export {
  createParent,
  getParents,
  getParentById,
  updateParent,
  updateParentStatus,
  deleteParent,
  linkStudentsToParent,
};
