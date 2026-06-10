import Student from "../models/Student.js";

const ensureTeacherAcademicGroupAccess = (req, academicGroupId) => {
  if (req.user?.role !== "teacher") {
    return true;
  }

  const assignedGroups = (req.user?.assignedAcademicGroups || []).map((group) => String(group._id || group));
  if (assignedGroups.length === 0) {
    return true;
  }
  return assignedGroups.includes(String(academicGroupId));
};

const ensureTeacherSubjectAccess = (req, subject) => {
  if (req.user?.role !== "teacher") {
    return true;
  }

  return String(subject.teacherId?._id || subject.teacherId || "") === String(req.user._id);
};

const getStudentProfileForUser = async (userId) => {
  return Student.findOne({ _id: userId, isDeleted: false });
};

const ensureParentStudentAccess = async (req, studentId) => {
  if (req.user?.role !== "parent") {
    return true;
  }

  const linkedIds = (req.user?.linkedStudentIds || []).map((value) => String(value._id || value));
  return linkedIds.includes(String(studentId));
};

export {
  ensureTeacherAcademicGroupAccess,
  ensureTeacherSubjectAccess,
  getStudentProfileForUser,
  ensureParentStudentAccess,
};
