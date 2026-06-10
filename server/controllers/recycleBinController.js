import AuditLog from "../models/AuditLog.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { ensureUniqueStudentFields, ensureUniqueUserFields } from "../utils/uniqueFields.js";
import {
  RECYCLE_BIN_RETENTION_DAYS,
  getRecycleBinExpiryForRecord,
  hardDeleteStudentRecord,
  hardDeleteUserRecord,
} from "../utils/recycleBin.js";

const getRequestInstituteId = (req) => req.user.instituteId?._id || req.user.instituteId || null;

const canAccessInstitute = (req, instituteId) => {
  if (req.user.role === "superadmin") {
    return true;
  }

  return String(getRequestInstituteId(req) || "") === String(instituteId || "");
};

const getAllowedRoles = (req) =>
  req.user.role === "superadmin"
    ? ["admin", "teacher", "student", "parent", "staff"]
    : ["teacher", "student", "parent", "staff"];

const createRecycleBinItem = ({ entityType, role, id, name, email = "", phone = "", institute = null, deletedAt, expiresAt, meta = {} }) => ({
  id,
  entityType,
  role,
  name,
  email,
  phone,
  institute,
  deletedAt,
  recycleBinExpiresAt: expiresAt,
  daysRemaining: Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
  meta,
});

const listRecycleBinItems = async (req, res, next) => {
  try {
    const { role = "all", search = "", instituteId = "all" } = req.query;
    const allowedRoles = getAllowedRoles(req);

    if (role !== "all" && !allowedRoles.includes(role)) {
      res.status(400);
      throw new Error("Invalid recycle bin role filter");
    }

    const normalizedSearch = search.trim();
    const requestedInstituteId =
      req.user.role === "superadmin" && instituteId !== "all" ? instituteId : getRequestInstituteId(req);

    const userRoles = (role === "all" ? allowedRoles : [role]).filter((item) => item !== "student");
    const shouldIncludeStudents = role === "all" || role === "student";

    const userQuery = {
      isDeleted: true,
      role: { $in: userRoles.length ? userRoles : ["__none__"] },
    };

    if (requestedInstituteId) {
      userQuery.instituteId = requestedInstituteId;
    }

    if (normalizedSearch) {
      userQuery.$or = [
        { name: { $regex: normalizedSearch, $options: "i" } },
        { email: { $regex: normalizedSearch, $options: "i" } },
        { phone: { $regex: normalizedSearch, $options: "i" } },
        { employeeId: { $regex: normalizedSearch, $options: "i" } },
        { staffId: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    const studentQuery = {
      isDeleted: true,
    };

    if (requestedInstituteId) {
      studentQuery.instituteId = requestedInstituteId;
    }

    if (normalizedSearch) {
      studentQuery.$or = [
        { rollNumber: { $regex: normalizedSearch, $options: "i" } },
        { admissionNumber: { $regex: normalizedSearch, $options: "i" } },
        { registrationNumber: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    const [users, students] = await Promise.all([
      userRoles.length
        ? User.find(userQuery)
            .populate("instituteId", "name instituteCode")
            .sort({ deletedAt: -1 })
        : [],
      shouldIncludeStudents
        ? Student.find(studentQuery)
            .populate("userId", "name email phone")
            .populate("instituteId", "name instituteCode")
            .sort({ deletedAt: -1 })
        : [],
    ]);

    const items = [
      ...users.map((user) =>
        createRecycleBinItem({
          entityType: "user",
          role: user.role,
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          institute: user.instituteId
            ? {
                _id: user.instituteId._id,
                name: user.instituteId.name,
                instituteCode: user.instituteId.instituteCode,
              }
            : null,
          deletedAt: user.deletedAt,
          expiresAt: getRecycleBinExpiryForRecord(user),
          meta: {
            employeeId: user.employeeId || "",
            staffId: user.staffId || "",
          },
        })
      ),
      ...students.map((student) =>
        createRecycleBinItem({
          entityType: "student",
          role: "student",
          id: student._id,
          name: student.userId?.name || "Student",
          email: student.userId?.email || "",
          phone: student.userId?.phone || "",
          institute: student.instituteId
            ? {
                _id: student.instituteId._id,
                name: student.instituteId.name,
                instituteCode: student.instituteId.instituteCode,
              }
            : null,
          deletedAt: student.deletedAt,
          expiresAt: getRecycleBinExpiryForRecord(student),
          meta: {
            rollNumber: student.rollNumber,
            admissionNumber: student.admissionNumber,
            registrationNumber: student.registrationNumber || "",
          },
        })
      ),
    ].sort((left, right) => new Date(right.deletedAt).getTime() - new Date(left.deletedAt).getTime());

    res.json({
      retentionDays: RECYCLE_BIN_RETENTION_DAYS,
      items,
    });
  } catch (error) {
    next(error);
  }
};

const restoreRecycleBinItem = async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    if (!["user", "student"].includes(entityType)) {
      res.status(400);
      throw new Error("Invalid recycle bin entity type");
    }

    if (entityType === "student") {
      const student = await Student.findOne({ _id: id, isDeleted: true });
      if (!student) {
        res.status(404);
        throw new Error("Deleted student not found");
      }

      if (!canAccessInstitute(req, student.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      const user = await User.findById(student.userId).select("+password");
      if (!user) {
        res.status(404);
        throw new Error("Student login record not found");
      }

      await ensureUniqueUserFields({
        email: user.email,
        phone: user.phone,
        excludeUserId: user._id,
      });
      await ensureUniqueStudentFields({
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        registrationNumber: student.registrationNumber,
        excludeStudentId: student._id,
      });

      student.isDeleted = false;
      student.deletedAt = null;
      student.recycleBinExpiresAt = null;
      student.status = "active";
      await student.save();

      user.isDeleted = false;
      user.deletedAt = null;
      user.recycleBinExpiresAt = null;
      user.status = "active";
      await user.save();

      await AuditLog.create({
        instituteId: student.instituteId,
        userId: req.user._id,
        action: "restore",
        module: "recycle_bin",
        targetId: student._id,
        targetType: "Student",
        metadata: { role: "student" },
        ipAddress: req.ip,
      });

      return res.json({ message: "Student restored from recycle bin successfully" });
    }

    const user = await User.findOne({ _id: id, isDeleted: true });
    if (!user) {
      res.status(404);
      throw new Error("Deleted user not found");
    }

    if (!getAllowedRoles(req).includes(user.role)) {
      res.status(403);
      throw new Error("You cannot restore this role");
    }

    if (!canAccessInstitute(req, user.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this recycle bin record");
    }

    await ensureUniqueUserFields({
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      staffId: user.staffId,
      excludeUserId: user._id,
    });

    user.isDeleted = false;
    user.deletedAt = null;
    user.recycleBinExpiresAt = null;
    user.status = "active";
    await user.save();

    await AuditLog.create({
      instituteId: user.instituteId,
      userId: req.user._id,
      action: "restore",
      module: "recycle_bin",
      targetId: user._id,
      targetType: "User",
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({ message: "User restored from recycle bin successfully" });
  } catch (error) {
    next(error);
  }
};

const permanentlyDeleteRecycleBinItem = async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    if (!["user", "student"].includes(entityType)) {
      res.status(400);
      throw new Error("Invalid recycle bin entity type");
    }

    if (entityType === "student") {
      const student = await Student.findOne({ _id: id, isDeleted: true });
      if (!student) {
        res.status(404);
        throw new Error("Deleted student not found");
      }

      if (!canAccessInstitute(req, student.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      await hardDeleteStudentRecord(student);

      await AuditLog.create({
        instituteId: student.instituteId,
        userId: req.user._id,
        action: "permanent_delete",
        module: "recycle_bin",
        targetId: student._id,
        targetType: "Student",
        metadata: { role: "student" },
        ipAddress: req.ip,
      });

      return res.json({ message: "Student permanently deleted from recycle bin" });
    }

    const user = await User.findOne({ _id: id, isDeleted: true });
    if (!user) {
      res.status(404);
      throw new Error("Deleted user not found");
    }

    if (!getAllowedRoles(req).includes(user.role)) {
      res.status(403);
      throw new Error("You cannot permanently delete this role");
    }

    if (!canAccessInstitute(req, user.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this recycle bin record");
    }

    await hardDeleteUserRecord(user);

    await AuditLog.create({
      instituteId: user.instituteId,
      userId: req.user._id,
      action: "permanent_delete",
      module: "recycle_bin",
      targetId: user._id,
      targetType: "User",
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({ message: "User permanently deleted from recycle bin" });
  } catch (error) {
    next(error);
  }
};

export {
  listRecycleBinItems,
  restoreRecycleBinItem,
  permanentlyDeleteRecycleBinItem,
};
