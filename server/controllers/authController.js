import AuditLog from "../models/AuditLog.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";
import UISettings from "../models/UISettings.js";
import generateToken from "../utils/generateToken.js";
import { serializeUser } from "../utils/serializers.js";
import bcrypt from "bcryptjs";

const notDeletedFilter = {
  $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
};

const findMatchingUserByPassword = async (users, password) => {
  for (const candidate of users) {
    const isMatched = await candidate.matchPassword(password);
    if (isMatched) {
      return candidate;
    }
  }
  return null;
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedIdentifier = email?.trim();

    if (!normalizedIdentifier || !password) {
      res.status(400);
      throw new Error("Username and password are required");
    }

    const normalizedEmail = normalizedIdentifier.toLowerCase();
    const [
      studentEmail, teacherEmail, parentEmail, staffEmail, adminEmail, superAdminEmail,
      studentPhone, teacherPhone, parentPhone, staffPhone, adminPhone, superAdminPhone,
      studentRoll,
      teacherEmployee,
      staffIdQuery
    ] = await Promise.all([
      // Email queries
      Student.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Teacher.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Parent.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      StaffMember.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Admin.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      SuperAdmin.find({ email: normalizedEmail, ...notDeletedFilter }).select("+password"),

      // Phone queries
      Student.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Teacher.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Parent.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      StaffMember.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Admin.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      SuperAdmin.find({ phone: normalizedIdentifier, ...notDeletedFilter }).select("+password"),

      // Role-specific identifiers
      Student.find({ rollNumber: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      Teacher.find({ employeeId: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
      StaffMember.find({ staffId: normalizedIdentifier, ...notDeletedFilter }).select("+password").populate("instituteId", "name instituteCode instituteType status"),
    ]);

    const allCandidates = [
      ...studentEmail, ...teacherEmail, ...parentEmail, ...staffEmail, ...adminEmail, ...superAdminEmail,
      ...studentPhone, ...teacherPhone, ...parentPhone, ...staffPhone, ...adminPhone, ...superAdminPhone,
      ...studentRoll, ...teacherEmployee, ...staffIdQuery
    ];

    const uniqueCandidates = [];
    const seenIds = new Set();

    allCandidates.forEach((candidate) => {
      const candidateId = String(candidate._id);
      if (!seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        uniqueCandidates.push(candidate);
      }
    });

    if (uniqueCandidates.length === 0) {
      res.status(401);
      throw new Error("Invalid username or password");
    }

    const user = await findMatchingUserByPassword(uniqueCandidates, password);

    if (!user) {
      res.status(401);
      throw new Error("Invalid username or password");
    }

    if (user.isDeleted) {
      res.status(401);
      throw new Error("Invalid username or password");
    }

    if (user.status !== "active") {
      res.status(403);
      throw new Error("Your account is inactive");
    }

    await AuditLog.create({
      instituteId: user.instituteId?._id || null,
      userId: user._id,
      action: "login",
      module: "auth",
      targetId: user._id,
      targetType: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({
    user: serializeUser(req.user),
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { role, email, rollNumber, dob, phone, newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      res.status(400);
      throw new Error("New password is required and must be at least 6 characters");
    }

    if (role === "student") {
      if (!rollNumber || !email || !dob) {
        res.status(400);
        throw new Error("Roll number, email, and Date of Birth are required for student password reset");
      }

      const student = await Student.findOne({
        rollNumber: rollNumber.trim(),
        ...notDeletedFilter,
      }).select("+password");

      if (!student) {
        res.status(404);
        throw new Error("Student profile not found with the given roll number");
      }

      if (student.email.toLowerCase() !== email.trim().toLowerCase()) {
        res.status(400);
        throw new Error("Verification failed: Email does not match student record");
      }

      if (!student.dob) {
        res.status(400);
        throw new Error("Verification failed: No Date of Birth registered on this profile");
      }

      const inputDate = new Date(dob);
      const studentDate = new Date(student.dob);
      const dobMatched = inputDate.getFullYear() === studentDate.getFullYear() &&
                         inputDate.getMonth() === studentDate.getMonth() &&
                         inputDate.getDate() === studentDate.getDate();

      if (!dobMatched) {
        res.status(400);
        throw new Error("Verification failed: Date of Birth does not match");
      }

      student.password = newPassword.trim();
      await student.save();

      return res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
    } else {
      if (!email || !phone) {
        res.status(400);
        throw new Error("Email and phone number are required for verification");
      }

      const modelMap = {
        teacher: Teacher,
        parent: Parent,
        staff: StaffMember,
        admin: Admin,
        superadmin: SuperAdmin,
      };

      const Model = modelMap[role];
      if (!Model) {
        res.status(400);
        throw new Error("Invalid role specified");
      }

      const user = await Model.findOne({
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        ...notDeletedFilter,
      }).select("+password");

      if (!user) {
        res.status(400);
        throw new Error("Verification failed: Email or phone number does not match our records");
      }

      user.password = newPassword.trim();
      await user.save();

      return res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
    }
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Current password and new password are required");
    }

    if (newPassword.trim().length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    const modelMap = {
      student: Student,
      teacher: Teacher,
      parent: Parent,
      staff: StaffMember,
      admin: Admin,
      superadmin: SuperAdmin,
    };

    const Model = modelMap[req.user.role];
    if (!Model) {
      res.status(404);
      throw new Error("Role model not found");
    }

    const user = await Model.findById(req.user._id).select("+password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const isMatched = await user.matchPassword(currentPassword);
    if (!isMatched) {
      res.status(400);
      throw new Error("Incorrect current password");
    }

    user.password = newPassword.trim();
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

const resetManagedUserPassword = async (req, res, next) => {
  try {
    const { targetRole, targetId, newPassword } = req.body;

    if (!["admin", "superadmin"].includes(req.user.role)) {
      res.status(403);
      throw new Error("Only admin or super admin can reset user passwords");
    }

    if (!targetRole || !targetId || !newPassword) {
      res.status(400);
      throw new Error("Target role, target ID, and new password are required");
    }

    if (newPassword.trim().length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    const allowedRoleMap = {
      admin: ["teacher", "student", "parent", "staff"],
      superadmin: ["teacher", "student", "parent", "staff", "admin"],
    };

    if (!allowedRoleMap[req.user.role]?.includes(targetRole)) {
      res.status(403);
      throw new Error("You are not allowed to reset the password for this role");
    }

    const modelMap = {
      student: Student,
      teacher: Teacher,
      parent: Parent,
      staff: StaffMember,
      admin: Admin,
      superadmin: SuperAdmin,
    };

    const Model = modelMap[targetRole];
    if (!Model) {
      res.status(400);
      throw new Error("Invalid target role");
    }

    const targetUser = await Model.findOne({
      _id: targetId,
      ...notDeletedFilter,
    }).select("+password");

    if (!targetUser) {
      res.status(404);
      throw new Error("Target user not found");
    }

    const instituteId = targetUser.instituteId || null;

    if (
      req.user.role === "admin" &&
      String(instituteId || "") !== String(req.user.instituteId?._id || req.user.instituteId || "")
    ) {
      res.status(403);
      throw new Error("You can only reset passwords inside your own institute");
    }

    targetUser.password = newPassword.trim();
    await targetUser.save();

    await AuditLog.create({
      instituteId,
      userId: req.user._id,
      action: "managed_password_reset",
      module: "auth",
      targetId: targetId,
      targetType: targetRole.charAt(0).toUpperCase() + targetRole.slice(1),
      metadata: {
        targetRole,
        resetByRole: req.user.role,
        targetUserId: targetUser._id,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} password updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const recoverPrivilegedAccountPassword = async (req, res, next) => {
  try {
    const { role, email, phone, recoveryKey, newPassword } = req.body;

    if (!["admin", "superadmin"].includes(role)) {
      res.status(400);
      throw new Error("Recovery is only available for admin and super admin accounts");
    }

    if (!email?.trim() || !phone?.trim() || !recoveryKey?.trim() || !newPassword?.trim()) {
      res.status(400);
      throw new Error("Role, email, mobile number, recovery key, and new password are required");
    }

    if (newPassword.trim().length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    const settings = await UISettings.findOne({ instituteId: null }).select("+privilegedRecoveryKeyHash");
    if (!settings?.privilegedRecoveryEnabled || !settings?.privilegedRecoveryKeyHash) {
      res.status(403);
      throw new Error("Secure recovery is currently disabled");
    }

    const isRecoveryKeyValid = await bcrypt.compare(recoveryKey.trim(), settings.privilegedRecoveryKeyHash);
    if (!isRecoveryKeyValid) {
      res.status(403);
      throw new Error("Recovery verification failed");
    }

    const modelMap = {
      admin: Admin,
      superadmin: SuperAdmin,
    };

    const Model = modelMap[role];
    const user = await Model.findOne({
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      ...notDeletedFilter,
    }).select("+password");

    if (!user) {
      res.status(400);
      throw new Error("Recovery verification failed");
    }

    user.password = newPassword.trim();
    await user.save();

    await AuditLog.create({
      instituteId: user.instituteId || null,
      userId: user._id,
      action: "privileged_recovery_reset",
      module: "auth",
      targetId: user._id,
      targetType: role === "superadmin" ? "SuperAdmin" : "Admin",
      metadata: {
        role,
        recoveredFromPublicFlow: true,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `${role === "superadmin" ? "Super Admin" : "Admin"} password reset successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      res.status(400);
      throw new Error("Name and email are required");
    }

    const modelMap = {
      student: Student,
      teacher: Teacher,
      parent: Parent,
      staff: StaffMember,
      admin: Admin,
      superadmin: SuperAdmin,
    };

    const models = [Student, Teacher, Parent, StaffMember, Admin, SuperAdmin];
    const Model = modelMap[req.user.role];
    const user = await Model.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Check for email uniqueness across all collections
    if (email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const emailToCheck = email.toLowerCase().trim();
      const duplicates = await Promise.all(
        models.map((M) => M.findOne({ email: emailToCheck, ...notDeletedFilter }))
      );
      if (duplicates.some((dup) => dup)) {
        res.status(400);
        throw new Error("Email is already taken by another account");
      }
    }

    // Check for phone uniqueness across all collections
    if (phone && phone.trim() !== user.phone) {
      const phoneToCheck = phone.trim();
      const duplicates = await Promise.all(
        models.map((M) => M.findOne({ phone: phoneToCheck, ...notDeletedFilter }))
      );
      if (duplicates.some((dup) => dup)) {
        res.status(400);
        throw new Error("Phone number is already taken by another account");
      }
    }

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    await AuditLog.create({
      instituteId: user.instituteId || null,
      userId: user._id,
      action: "update_profile",
      module: "auth",
      targetId: user._id,
      targetType: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export { loginUser, getProfile, forgotPassword, changePassword, resetManagedUserPassword, recoverPrivilegedAccountPassword, updateProfile };
