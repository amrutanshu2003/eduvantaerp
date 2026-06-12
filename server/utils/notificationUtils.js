import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";

/**
 * Create a notification
 * @param {Object} options - Notification options
 * @param {String} options.instituteId - Institute ID (optional)
 * @param {String|Array} options.recipientUserId - Recipient user ID or array of user IDs
 * @param {String} options.recipientRole - Recipient role (optional)
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.type - Notification type (info, success, warning, error, attendance, fees, notice, assignment, exam, hostel, transport, library, system)
 * @param {String} options.link - Notification link (optional)
 * @param {String} options.priority - Priority (low, normal, high, urgent)
 * @param {String} options.createdBy - Creator user ID (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 */
const createNotification = async (options) => {
  try {
    const {
      instituteId,
      recipientUserId,
      recipientRole,
      title,
      message,
      type = "info",
      link = null,
      priority = "normal",
      createdBy = null,
      metadata = null,
    } = options;

    if (!title?.trim() || !message?.trim()) {
      console.error("Notification title and message are required");
      return;
    }

    if (!recipientUserId && !recipientRole) {
      console.error("Either recipientUserId or recipientRole is required");
      return;
    }

    // If recipientUserId is an array, create notifications for each user
    if (Array.isArray(recipientUserId)) {
      const notifications = recipientUserId.map((userId) => ({
        instituteId: instituteId || null,
        recipientUserId: userId,
        recipientRole: recipientRole || null,
        title: title.trim(),
        message: message.trim(),
        type,
        link,
        priority,
        createdBy,
        metadata,
      }));

      await Notification.insertMany(notifications);
      return;
    }

    // Single notification
    await Notification.create({
      instituteId: instituteId || null,
      recipientUserId: recipientUserId || null,
      recipientRole: recipientRole || null,
      title: title.trim(),
      message: message.trim(),
      type,
      link,
      priority,
      createdBy,
      metadata,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * Get user IDs by role and institute
 * @param {String} role - Role (teacher, student, parent, staff)
 * @param {String} instituteId - Institute ID
 * @param {String} academicGroupId - Academic group ID (optional, for students/teachers)
 * @returns {Array} Array of user IDs
 */
const getUserIdsByRole = async (role, instituteId, academicGroupId = null) => {
  try {
    let userIds = [];

    switch (role) {
      case "student":
        const studentQuery = { instituteId, isDeleted: false };
        if (academicGroupId) {
          studentQuery.academicGroupId = academicGroupId;
        }
        const students = await Student.find(studentQuery).select("userId");
        userIds = students.map((s) => s.userId);
        break;

      case "teacher":
        const teacherQuery = { instituteId, isDeleted: false };
        if (academicGroupId) {
          teacherQuery.academicGroupIds = academicGroupId;
        }
        const teachers = await Teacher.find(teacherQuery).select("userId");
        userIds = teachers.map((t) => t.userId);
        break;

      case "parent":
        const parents = await Parent.find({ instituteId, isDeleted: false }).select("userId");
        userIds = parents.map((p) => p.userId);
        break;

      case "staff":
        const staff = await StaffMember.find({ instituteId, isDeleted: false }).select("userId");
        userIds = staff.map((s) => s.userId);
        break;

      default:
        break;
    }

    return userIds;
  } catch (error) {
    console.error("Error getting user IDs by role:", error);
    return [];
  }
};

/**
 * Get parent user IDs for a student
 * @param {String} studentId - Student ID
 * @returns {Array} Array of parent user IDs
 */
const getParentUserIdsForStudent = async (studentId) => {
  try {
    const student = await Student.findById(studentId).select("linkedParentIds");
    if (!student) return [];

    const parents = await Parent.find({ _id: { $in: student.linkedParentIds || [] }, isDeleted: false }).select("userId");
    return parents.map((p) => p.userId);
  } catch (error) {
    console.error("Error getting parent user IDs for student:", error);
    return [];
  }
};

export {
  createNotification,
  getUserIdsByRole,
  getParentUserIdsForStudent,
};
