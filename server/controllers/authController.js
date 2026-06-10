import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import generateToken from "../utils/generateToken.js";
import { serializeUser } from "../utils/serializers.js";

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
    const [emailUsers, phoneUsers, employeeIdUsers, staffIdUsers, studentProfiles] = await Promise.all([
      User.find({
        email: normalizedEmail,
        ...notDeletedFilter,
      })
        .select("+password")
        .populate("instituteId", "name instituteCode instituteType status"),
      User.find({
        phone: normalizedIdentifier,
        ...notDeletedFilter,
      })
        .select("+password")
        .populate("instituteId", "name instituteCode instituteType status"),
      User.find({
        employeeId: normalizedIdentifier,
        ...notDeletedFilter,
      })
        .select("+password")
        .populate("instituteId", "name instituteCode instituteType status"),
      User.find({
        staffId: normalizedIdentifier,
        ...notDeletedFilter,
      })
        .select("+password")
        .populate("instituteId", "name instituteCode instituteType status"),
      Student.find({
        rollNumber: normalizedIdentifier,
        ...notDeletedFilter,
      }),
    ]);

    const studentUsers = studentProfiles.length
      ? await User.find({
          _id: { $in: studentProfiles.map((profile) => profile.userId) },
          ...notDeletedFilter,
        })
          .select("+password")
          .populate("instituteId", "name instituteCode instituteType status")
      : [];

    const allCandidates = [...emailUsers, ...phoneUsers, ...employeeIdUsers, ...staffIdUsers, ...studentUsers];
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
      targetType: "User",
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
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
      })
        .populate("userId");

      if (!student || !student.userId) {
        res.status(404);
        throw new Error("Student profile not found with the given roll number");
      }

      if (student.userId.email.toLowerCase() !== email.trim().toLowerCase()) {
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

      const user = await User.findById(student.userId._id).select("+password");
      user.password = newPassword.trim();
      await user.save();

      return res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
    } else {
      if (!email || !phone) {
        res.status(400);
        throw new Error("Email and phone number are required for verification");
      }

      const user = await User.findOne({
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        ...(role ? { role } : {}),
        ...notDeletedFilter,
      });
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

    const user = await User.findById(req.user._id).select("+password");
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

    let targetUser = null;
    let instituteId = null;
    let auditTargetId = targetId;
    let auditTargetType = "User";

    if (targetRole === "student") {
      const student = await Student.findOne({
        _id: targetId,
        ...notDeletedFilter,
      });

      if (!student) {
        res.status(404);
        throw new Error("Student not found");
      }

      targetUser = await User.findById(student.userId).select("+password");
      if (!targetUser || targetUser.isDeleted) {
        res.status(404);
        throw new Error("Student login account not found");
      }

      instituteId = student.instituteId;
      auditTargetType = "Student";
    } else {
      targetUser = await User.findOne({
        _id: targetId,
        role: targetRole,
        ...notDeletedFilter,
      }).select("+password");

      if (!targetUser) {
        res.status(404);
        throw new Error("Target user not found");
      }

      instituteId = targetUser.instituteId || null;
    }

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
      targetId: auditTargetId,
      targetType: auditTargetType,
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

export { loginUser, getProfile, forgotPassword, changePassword, resetManagedUserPassword };
