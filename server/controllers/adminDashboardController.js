import AcademicGroup from "../models/AcademicGroup.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import { getScopedInstituteId } from "../utils/scope.js";

const getAdminDashboardStats = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const baseQuery = { instituteId, isDeleted: false };

    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff,
      totalAcademicGroups,
      activeStudents,
      activeStaff,
    ] = await Promise.all([
      Student.countDocuments(baseQuery),
      Teacher.countDocuments(baseQuery),
      Parent.countDocuments(baseQuery),
      StaffMember.countDocuments(baseQuery),
      AcademicGroup.countDocuments(baseQuery),
      Student.countDocuments({ ...baseQuery, status: "active" }),
      StaffMember.countDocuments({ ...baseQuery, status: "active" }),
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
