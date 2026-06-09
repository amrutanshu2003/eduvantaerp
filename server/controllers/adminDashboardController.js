import AcademicGroup from "../models/AcademicGroup.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { getScopedInstituteId } from "../utils/scope.js";

const getAdminDashboardStats = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const baseUserQuery = { instituteId, isDeleted: false };
    const baseStudentQuery = { instituteId, isDeleted: false };
    const baseGroupQuery = { instituteId, isDeleted: false };

    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff,
      totalAcademicGroups,
      activeStudents,
      activeStaff,
    ] = await Promise.all([
      Student.countDocuments(baseStudentQuery),
      User.countDocuments({ ...baseUserQuery, role: "teacher" }),
      User.countDocuments({ ...baseUserQuery, role: "parent" }),
      User.countDocuments({ ...baseUserQuery, role: "staff" }),
      AcademicGroup.countDocuments(baseGroupQuery),
      Student.countDocuments({ ...baseStudentQuery, status: "active" }),
      User.countDocuments({ ...baseUserQuery, role: "staff", status: "active" }),
    ]);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalStaff,
        totalAcademicGroups,
        activeStudents,
        activeStaff,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getAdminDashboardStats };
