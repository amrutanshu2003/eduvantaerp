import User from "../models/User.js";
import Institute from "../models/Institute.js";
import AuditLog from "../models/AuditLog.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureUniqueUserFields } from "../utils/uniqueFields.js";

const getAdmins = async (req, res, next) => {
  try {
    const { search = "", status = "all", instituteId = "all" } = req.query;
    const query = { role: "admin", isDeleted: false };

    if (status !== "all") {
      query.status = status;
    }

    if (instituteId !== "all") {
      query.instituteId = instituteId;
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const admins = await User.find(query)
      .populate("instituteId", "name instituteCode instituteType status")
      .sort({ createdAt: -1 });

    res.json({
      admins: admins.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

const getAdminById = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin", isDeleted: false })
      .populate("instituteId", "name instituteCode instituteType status");

    if (!admin) {
      res.status(404);
      throw new Error("Admin not found");
    }

    res.json({ admin: serializeUser(admin) });
  } catch (error) {
    next(error);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password, instituteId, permissions = [], status = "active" } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !instituteId) {
      res.status(400);
      throw new Error("Name, email, password, and institute are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    await ensureUniqueUserFields({
      email: normalizedEmail,
      phone,
    });

    const institute = await Institute.findOne({ _id: instituteId, isDeleted: false });
    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "admin",
      instituteId: institute._id,
      permissions,
      status,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      instituteId: institute._id,
      userId: req.user._id,
      action: "create_admin",
      module: "admin_management",
      targetId: adminUser._id,
      targetType: "User",
      metadata: { instituteCode: institute.instituteCode, role: "admin" },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: serializeUser(adminUser),
    });
  } catch (error) {
    next(error);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin", isDeleted: false }).select("+password");

    if (!admin) {
      res.status(404);
      throw new Error("Admin not found");
    }

    const { name, email, phone, password, instituteId, permissions, status } = req.body;

    await ensureUniqueUserFields({
      email: email ?? admin.email,
      phone: phone ?? admin.phone,
      excludeUserId: admin._id,
    });

    if (instituteId && String(instituteId) !== String(admin.instituteId)) {
      const institute = await Institute.findOne({ _id: instituteId, isDeleted: false });
      if (!institute) {
        res.status(404);
        throw new Error("Institute not found");
      }
      admin.instituteId = institute._id;
    }

    admin.name = name?.trim() ?? admin.name;
    admin.email = email?.trim().toLowerCase() ?? admin.email;
    admin.phone = phone?.trim() ?? admin.phone;
    admin.status = status ?? admin.status;
    if (permissions) admin.permissions = permissions;

    if (password?.trim()) {
      admin.password = password.trim();
    }

    await admin.save();

    await AuditLog.create({
      instituteId: admin.instituteId,
      userId: req.user._id,
      action: "update_admin",
      module: "admin_management",
      targetId: admin._id,
      targetType: "User",
      metadata: { role: "admin" },
      ipAddress: req.ip,
    });

    res.json({
      message: "Admin updated successfully",
      admin: serializeUser(admin),
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const admin = await User.findOne({ _id: req.params.id, role: "admin", isDeleted: false });

    if (!admin) {
      res.status(404);
      throw new Error("Admin not found");
    }

    admin.status = status;
    await admin.save();

    await AuditLog.create({
      instituteId: admin.instituteId,
      userId: req.user._id,
      action: "status_update",
      module: "admin_management",
      targetId: admin._id,
      targetType: "User",
      metadata: { status },
      ipAddress: req.ip,
    });

    res.json({ message: "Admin status updated successfully", admin: serializeUser(admin) });
  } catch (error) {
    next(error);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin", isDeleted: false });

    if (!admin) {
      res.status(404);
      throw new Error("Admin not found");
    }

    admin.isDeleted = true;
    admin.deletedAt = new Date();
    admin.status = "inactive";
    await admin.save();

    await AuditLog.create({
      instituteId: admin.instituteId,
      userId: req.user._id,
      action: "soft_delete",
      module: "admin_management",
      targetId: admin._id,
      targetType: "User",
      metadata: { role: "admin" },
      ipAddress: req.ip,
    });

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
};
