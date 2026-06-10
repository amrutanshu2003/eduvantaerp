import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";
import AcademicGroup from "../models/AcademicGroup.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Attendance from "../models/Attendance.js";
import BookIssue from "../models/BookIssue.js";
import Exam from "../models/Exam.js";
import Fee from "../models/Fee.js";
import Hostel from "../models/Hostel.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelBed from "../models/HostelBed.js";
import HostelComplaint from "../models/HostelComplaint.js";
import HostelOutpass from "../models/HostelOutpass.js";
import HostelRoom from "../models/HostelRoom.js";
import Institute from "../models/Institute.js";
import LibraryBook from "../models/LibraryBook.js";
import Marks from "../models/Marks.js";
import Notice from "../models/Notice.js";
import Subject from "../models/Subject.js";
import Timetable from "../models/Timetable.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import TransportVehicle from "../models/TransportVehicle.js";

const RECYCLE_BIN_RETENTION_DAYS = 7;
const RECYCLE_BIN_RETENTION_MS = RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const GENERIC_RECYCLE_BIN_MODELS = [
  AssignmentSubmission,
  Attendance,
  Assignment,
  AcademicGroup,
  Exam,
  Fee,
  Notice,
  Subject,
  Timetable,
  Marks,
  LibraryBook,
  BookIssue,
  Hostel,
  HostelRoom,
  HostelBed,
  HostelAllocation,
  HostelOutpass,
  HostelComplaint,
  TransportVehicle,
  TransportRoute,
  TransportAllocation,
  Institute,
];

const roleModelMap = {
  teacher: Teacher,
  parent: Parent,
  staff: StaffMember,
  admin: Admin,
  superadmin: SuperAdmin,
};

const getRecycleBinExpiryDate = (baseDate = new Date()) =>
  new Date(new Date(baseDate).getTime() + RECYCLE_BIN_RETENTION_MS);

const getRecycleBinExpiryForRecord = (record) => {
  if (record?.recycleBinExpiresAt) {
    return new Date(record.recycleBinExpiresAt);
  }

  if (record?.deletedAt) {
    return getRecycleBinExpiryDate(record.deletedAt);
  }

  return getRecycleBinExpiryDate();
};

const hardDeleteUserRecord = async (user) => {
  if (!user) {
    return;
  }

  if (user.role === "parent") {
    await Student.updateMany(
      { parentIds: user._id },
      {
        $pull: { parentIds: user._id },
      }
    );
  }

  const Model = roleModelMap[user.role];
  if (Model) {
    await Model.deleteOne({ _id: user._id });
  }
};

const hardDeleteStudentRecord = async (student) => {
  if (!student) {
    return;
  }

  await Parent.updateMany(
    { linkedStudentIds: student._id },
    {
      $pull: { linkedStudentIds: student._id },
    }
  );

  await Student.deleteOne({ _id: student._id });
};

const purgeExpiredRecycleBinData = async () => {
  const now = new Date();
  const fallbackThreshold = new Date(now.getTime() - RECYCLE_BIN_RETENTION_MS);

  const expiredStudents = await Student.find({
    isDeleted: true,
    deletedAt: { $ne: null },
    $or: [
      { recycleBinExpiresAt: { $lte: now } },
      {
        recycleBinExpiresAt: null,
        deletedAt: { $lte: fallbackThreshold },
      },
    ],
  }).select("_id parentIds deletedAt recycleBinExpiresAt");

  for (const student of expiredStudents) {
    await hardDeleteStudentRecord(student);
  }

  const expiredUsers = [];
  for (const [role, Model] of Object.entries(roleModelMap)) {
    const expired = await Model.find({
      isDeleted: true,
      deletedAt: { $ne: null },
      $or: [
        { recycleBinExpiresAt: { $lte: now } },
        {
          recycleBinExpiresAt: null,
          deletedAt: { $lte: fallbackThreshold },
        },
      ],
    }).select("_id role deletedAt recycleBinExpiresAt");
    expiredUsers.push(...expired);
  }

  for (const user of expiredUsers) {
    await hardDeleteUserRecord(user);
  }

  for (const Model of GENERIC_RECYCLE_BIN_MODELS) {
    await Model.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: fallbackThreshold },
    });
  }
};

export {
  RECYCLE_BIN_RETENTION_DAYS,
  RECYCLE_BIN_RETENTION_MS,
  getRecycleBinExpiryDate,
  getRecycleBinExpiryForRecord,
  hardDeleteStudentRecord,
  hardDeleteUserRecord,
  purgeExpiredRecycleBinData,
};
