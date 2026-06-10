import AuditLog from "../models/AuditLog.js";
import Institute from "../models/Institute.js";
import User from "../models/User.js";
import { ensureUniqueUserFields } from "../utils/uniqueFields.js";

const instituteSelectFields =
  "name instituteCode instituteType email phone address logo headName status plan paymentStatus createdBy isDeleted deletedAt createdAt updatedAt";

const sanitizeInstitute = (institute) => ({
  _id: institute._id,
  name: institute.name,
  instituteCode: institute.instituteCode,
  instituteType: institute.instituteType,
  email: institute.email,
  phone: institute.phone,
  address: institute.address,
  logo: institute.logo,
  headName: institute.headName,
  status: institute.status,
  plan: institute.plan,
  paymentStatus: institute.paymentStatus,
  createdBy: institute.createdBy,
  isDeleted: institute.isDeleted,
  deletedAt: institute.deletedAt,
  createdAt: institute.createdAt,
  updatedAt: institute.updatedAt,
});

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  instituteId: user.instituteId,
  designation: user.designation,
  permissions: user.permissions,
  status: user.status,
  profilePhoto: user.profilePhoto,
  createdBy: user.createdBy,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateInstitutePayload = (payload) => {
  const requiredFields = ["name", "instituteCode", "instituteType", "email", "headName"];
  const missingFields = requiredFields.filter((field) => !payload[field]?.toString().trim());

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  if (!["school", "college", "university"].includes(payload.instituteType)) {
    return "Institute type must be school, college, or university";
  }

  if (payload.status && !["active", "inactive"].includes(payload.status)) {
    return "Status must be active or inactive";
  }

  if (payload.plan && !["free", "basic", "premium"].includes(payload.plan)) {
    return "Plan must be free, basic, or premium";
  }

  if (payload.paymentStatus && !["paid", "unpaid", "trial", "expired"].includes(payload.paymentStatus)) {
    return "Payment status must be paid, unpaid, trial, or expired";
  }

  return null;
};

const createInstitute = async (req, res, next) => {
  try {
    const validationError = validateInstitutePayload(req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const normalizedCode = req.body.instituteCode.trim().toUpperCase();
    const normalizedEmail = req.body.email.trim().toLowerCase();

    const existingInstitute = await Institute.findOne({
      $or: [{ instituteCode: normalizedCode }, { email: normalizedEmail }],
    });

    if (existingInstitute) {
      res.status(409);
      throw new Error("Institute with this code or email already exists");
    }

    const institute = await Institute.create({
      ...req.body,
      instituteCode: normalizedCode,
      email: normalizedEmail,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: "create",
      module: "institute",
      targetId: institute._id,
      targetType: "Institute",
      metadata: { instituteCode: institute.instituteCode },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Institute created successfully",
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    next(error);
  }
};

const getInstitutes = async (req, res, next) => {
  try {
    const { search = "", status = "all", instituteType = "all", plan = "all", paymentStatus = "all" } = req.query;
    const query = { isDeleted: false };

    if (status !== "all") {
      query.status = status;
    }

    if (instituteType !== "all") {
      query.instituteType = instituteType;
    }

    if (plan !== "all") {
      query.plan = plan;
    }

    if (paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { instituteCode: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { headName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [institutes, totalInstitutes, activeInstitutes, schoolCount, collegeCount, totalAdmins, trialExpiredInstitutes] =
      await Promise.all([
        Institute.find(query).select(instituteSelectFields).sort({ createdAt: -1 }),
        Institute.countDocuments({ isDeleted: false }),
        Institute.countDocuments({ isDeleted: false, status: "active" }),
        Institute.countDocuments({ isDeleted: false, instituteType: "school" }),
        Institute.countDocuments({ isDeleted: false, instituteType: "college" }),
        User.countDocuments({ role: "admin", status: "active" }),
        Institute.countDocuments({ isDeleted: false, paymentStatus: { $in: ["trial", "expired"] } }),
      ]);

    res.json({
      institutes: institutes.map(sanitizeInstitute),
      stats: {
        totalInstitutes,
        activeInstitutes,
        schoolCount,
        collegeCount,
        totalAdmins,
        trialExpiredInstitutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInstituteById = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false }).select(instituteSelectFields);

    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    const admins = await User.find({
      instituteId: institute._id,
      role: "admin",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      institute: sanitizeInstitute(institute),
      admins: admins.map(sanitizeUser),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false });

    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    const nextPayload = {
      ...sanitizeInstitute(institute),
      ...req.body,
    };

    const validationError = validateInstitutePayload(nextPayload);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const normalizedCode = req.body.instituteCode
      ? req.body.instituteCode.trim().toUpperCase()
      : institute.instituteCode;
    const normalizedEmail = req.body.email ? req.body.email.trim().toLowerCase() : institute.email;

    const duplicateInstitute = await Institute.findOne({
      _id: { $ne: institute._id },
      $or: [{ instituteCode: normalizedCode }, { email: normalizedEmail }],
    });

    if (duplicateInstitute) {
      res.status(409);
      throw new Error("Another institute already uses this code or email");
    }

    institute.name = req.body.name?.trim() ?? institute.name;
    institute.instituteCode = normalizedCode;
    institute.instituteType = req.body.instituteType ?? institute.instituteType;
    institute.email = normalizedEmail;
    institute.phone = req.body.phone?.trim() ?? institute.phone;
    institute.address = req.body.address?.trim() ?? institute.address;
    institute.logo = req.body.logo?.trim() ?? institute.logo;
    institute.headName = req.body.headName?.trim() ?? institute.headName;
    institute.status = req.body.status ?? institute.status;
    institute.plan = req.body.plan ?? institute.plan;
    institute.paymentStatus = req.body.paymentStatus ?? institute.paymentStatus;

    await institute.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "update",
      module: "institute",
      targetId: institute._id,
      targetType: "Institute",
      metadata: { instituteCode: institute.instituteCode },
      ipAddress: req.ip,
    });

    res.json({
      message: "Institute updated successfully",
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    next(error);
  }
};

const updateInstituteStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false });

    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    institute.status = status;
    await institute.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "status_update",
      module: "institute",
      targetId: institute._id,
      targetType: "Institute",
      metadata: { status },
      ipAddress: req.ip,
    });

    res.json({
      message: "Institute status updated successfully",
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    next(error);
  }
};

const deleteInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false });

    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    institute.isDeleted = true;
    institute.deletedAt = new Date();
    institute.status = "inactive";
    await institute.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "soft_delete",
      module: "institute",
      targetId: institute._id,
      targetType: "Institute",
      metadata: { instituteCode: institute.instituteCode },
      ipAddress: req.ip,
    });

    res.json({
      message: "Institute deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const createInstituteAdmin = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false });

    if (!institute) {
      res.status(404);
      throw new Error("Institute not found");
    }

    const { name, email, phone, password, permissions = [], status = "active", profilePhoto = "" } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    await ensureUniqueUserFields({
      email: normalizedEmail,
      phone,
    });

    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "admin",
      instituteId: institute._id,
      permissions,
      status,
      profilePhoto: profilePhoto.trim(),
      createdBy: req.user._id,
    });

    await AuditLog.create({
      instituteId: institute._id,
      userId: req.user._id,
      action: "create_admin",
      module: "institute",
      targetId: adminUser._id,
      targetType: "User",
      metadata: { instituteCode: institute.instituteCode, role: "admin" },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Institute admin created successfully",
      admin: sanitizeUser(adminUser),
    });
  } catch (error) {
    next(error);
  }
};

export {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  updateInstituteStatus,
  deleteInstitute,
  createInstituteAdmin,
};
