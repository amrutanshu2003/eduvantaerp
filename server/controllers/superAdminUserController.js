import SuperAdmin from "../models/SuperAdmin.js";
import AuditLog from "../models/AuditLog.js";
import { getRecycleBinExpiryDate } from "../utils/recycleBin.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureUniqueUserFields } from "../utils/uniqueFields.js";

const getSuperAdmins = async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const query = { isDeleted: false };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const superAdmins = await SuperAdmin.find(query).sort({ createdAt: -1 });

    res.json({
      superadmins: superAdmins.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

const createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    await ensureUniqueUserFields({
      email: normalizedEmail,
      phone,
    });

    const superAdminUser = await SuperAdmin.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "superadmin",
      permissions: ["*"],
      status: "active",
    });

    await AuditLog.create({
      instituteId: null,
      userId: req.user._id,
      action: "create_superadmin",
      module: "superadmin_management",
      targetId: superAdminUser._id,
      targetType: "SuperAdmin",
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Super Admin created successfully",
      superadmin: serializeUser(superAdminUser),
    });
  } catch (error) {
    next(error);
  }
};

const updateSuperAdmin = async (req, res, next) => {
  try {
    const superAdmin = await SuperAdmin.findOne({ _id: req.params.id, isDeleted: false }).select("+password");

    if (!superAdmin) {
      res.status(404);
      throw new Error("Super Admin not found");
    }

    const { name, email, phone, password, status } = req.body;

    await ensureUniqueUserFields({
      email: email ?? superAdmin.email,
      phone: phone ?? superAdmin.phone,
      excludeUserId: superAdmin._id,
    });

    superAdmin.name = name?.trim() ?? superAdmin.name;
    superAdmin.email = email?.trim().toLowerCase() ?? superAdmin.email;
    superAdmin.phone = phone?.trim() ?? superAdmin.phone;
    if (status) superAdmin.status = status;

    if (password?.trim()) {
      superAdmin.password = password.trim();
    }

    await superAdmin.save();

    await AuditLog.create({
      instituteId: null,
      userId: req.user._id,
      action: "update_superadmin",
      module: "superadmin_management",
      targetId: superAdmin._id,
      targetType: "SuperAdmin",
      ipAddress: req.ip,
    });

    res.json({
      message: "Super Admin updated successfully",
      superadmin: serializeUser(superAdmin),
    });
  } catch (error) {
    next(error);
  }
};

const deleteSuperAdmin = async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      res.status(400);
      throw new Error("You cannot delete your own account");
    }

    const superAdmin = await SuperAdmin.findOne({ _id: req.params.id, isDeleted: false });

    if (!superAdmin) {
      res.status(404);
      throw new Error("Super Admin not found");
    }

    superAdmin.isDeleted = true;
    superAdmin.deletedAt = new Date();
    superAdmin.recycleBinExpiresAt = getRecycleBinExpiryDate(superAdmin.deletedAt);
    superAdmin.status = "inactive";
    await superAdmin.save();

    await AuditLog.create({
      instituteId: null,
      userId: req.user._id,
      action: "soft_delete_superadmin",
      module: "superadmin_management",
      targetId: superAdmin._id,
      targetType: "SuperAdmin",
      ipAddress: req.ip,
    });

    res.json({ message: "Super Admin deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getSuperAdmins,
  createSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
};
