import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import generateToken from "../utils/generateToken.js";
import { serializeUser } from "../utils/serializers.js";

const notDeletedFilter = {
  $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedIdentifier = email?.trim();

    if (!normalizedIdentifier || !password) {
      res.status(400);
      throw new Error("Username/Email or Roll number and password are required");
    }

    let user = null;
    let identifierExists = false;

    // 1. Search by email first
    const emailUser = await User.findOne({
      email: normalizedIdentifier.toLowerCase(),
      ...notDeletedFilter,
    })
      .select("+password")
      .populate("instituteId", "name instituteCode instituteType status");

    if (emailUser) {
      identifierExists = true;
      const isMatched = await emailUser.matchPassword(password);
      if (isMatched) {
        user = emailUser;
      }
    } else {
      // 2. Search by roll number
      const studentProfiles = await Student.find({
        rollNumber: normalizedIdentifier,
        ...notDeletedFilter,
      });
      if (studentProfiles.length > 0) {
        identifierExists = true;
        // Search if any associated user matches password
        for (const profile of studentProfiles) {
          const potentialUser = await User.findOne({
            _id: profile.userId,
            ...notDeletedFilter,
          })
            .select("+password")
            .populate("instituteId", "name instituteCode instituteType status");
          
          if (potentialUser) {
            const isMatched = await potentialUser.matchPassword(password);
            if (isMatched) {
              user = potentialUser;
              break;
            }
          }
        }
      }
    }

    // If neither email nor roll number exists
    if (!identifierExists) {
      res.status(401);
      throw new Error("Invalid username or roll number");
    }

    // If identifier exists, but password didn't match for any profile
    if (!user) {
      res.status(401);
      throw new Error("Invalid password");
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

export { loginUser, getProfile, forgotPassword, changePassword };
