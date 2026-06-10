import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Exam from "../models/Exam.js";
import Fee from "../models/Fee.js";
import BookIssue from "../models/BookIssue.js";
import Hostel from "../models/Hostel.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelBed from "../models/HostelBed.js";
import HostelComplaint from "../models/HostelComplaint.js";
import HostelOutpass from "../models/HostelOutpass.js";
import HostelRoom from "../models/HostelRoom.js";
import LibraryBook from "../models/LibraryBook.js";
import Marks from "../models/Marks.js";
import Notice from "../models/Notice.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Timetable from "../models/Timetable.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import TransportVehicle from "../models/TransportVehicle.js";
import StaffMember from "../models/StaffMember.js";
import { canManageHostel, isHostelSecurityUser } from "../utils/hostelAccess.js";
import { canManageLibrary } from "../utils/libraryAccess.js";
import { getIssueStatus } from "../utils/libraryUtils.js";
import { buildPublishedNoticeQuery } from "../utils/noticeUtils.js";
import { getScopedInstituteId } from "../utils/scope.js";
import { getStudentProfileForUser } from "../utils/roleAccess.js";
import { canManageTransport, isDriverUser } from "../utils/transportAccess.js";

const getLatestNotices = async ({ instituteId, role, academicGroupIds = [] }) => {
  const notices = await Notice.find(buildPublishedNoticeQuery({ instituteId, role, academicGroupIds }))
    .sort({ publishDate: -1, createdAt: -1 })
    .limit(5)
    .select("title noticeType priority publishDate audience academicGroupId");

  return notices.map((notice) => ({
    _id: notice._id,
    title: notice.title,
    noticeType: notice.noticeType,
    priority: notice.priority,
    publishDate: notice.publishDate,
    audience: notice.audience,
    academicGroupId: notice.academicGroupId,
  }));
};

const countFeesByStatus = async (query) => {
  // Use aggregation to compute fee status entirely in MongoDB — avoids
  // fetching all fee documents into Node.js memory
  const now = new Date();
  const results = await Fee.aggregate([
    { $match: { ...query, ...(query.instituteId ? { instituteId: query.instituteId } : {}) } },
    {
      $addFields: {
        payable: { $max: [0, { $add: [{ $subtract: ["$amount", { $ifNull: ["$discount", 0] }] }, { $ifNull: ["$fine", 0] }] }] },
        paid: { $ifNull: ["$paidAmount", 0] },
      },
    },
    {
      $addFields: {
        computedStatus: {
          $cond: [
            { $gte: ["$paid", "$payable"] },
            "paid",
            "pending",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$computedStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = { paid: 0, pending: 0 };
  for (const row of results) {
    if (row._id === "paid") summary.paid = row.count;
    if (row._id === "pending") summary.pending = row.count;
  }
  return summary;
};

const getCurrentDayKey = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

const countTeacherTodayPeriods = async (teacherId, instituteId) => {
  const today = getCurrentDayKey();
  const timetables = await Timetable.find({
    instituteId,
    dayOfWeek: today,
    status: "active",
    isDeleted: false,
    "periods.teacherId": teacherId,
  }).select("periods");

  return timetables.reduce(
    (count, timetable) =>
      count +
      timetable.periods.filter((period) => String(period.teacherId || "") === String(teacherId)).length,
    0
  );
};

const countStudentTodayPeriods = async (instituteId, academicGroupId) => {
  const today = getCurrentDayKey();
  const timetables = await Timetable.find({
    instituteId,
    academicGroupId,
    dayOfWeek: today,
    status: "active",
    isDeleted: false,
  }).select("periods");

  return timetables.reduce((count, timetable) => count + timetable.periods.length, 0);
};

const countOverdueIssues = async (query) => {
  return BookIssue.countDocuments({
    ...query,
    status: { $in: ["issued", "overdue"] },
    returnDate: null,
    dueDate: { $lt: new Date() },
  });
};

const getAdminPhase4Stats = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalSubjects, totalExams, todayAttendanceCount, pendingMarks, publishedResults, publishedNotices, draftNotices, feeSummary, latestNotices, activeTimetables, activeAssignments, totalBooks, availableBooks, issuedBooks, overdueBooks, totalVehicles, activeRoutes, transportStudents, vehiclesInMaintenance, totalHostels, activeHostels, availableBeds, bedsInMaintenance, hostelStudents, pendingHostelOutpasses, openHostelComplaints] = await Promise.all([
      Subject.countDocuments({ instituteId, isDeleted: false }),
      Exam.countDocuments({ instituteId, isDeleted: false }),
      Attendance.countDocuments({ instituteId, isDeleted: false, date: { $gte: today, $lt: tomorrow } }),
      Marks.countDocuments({ instituteId, isDeleted: false, status: { $in: ["draft", "submitted"] } }),
      Marks.countDocuments({ instituteId, isDeleted: false, status: "published" }),
      Notice.countDocuments({ instituteId, isDeleted: false, status: "published" }),
      Notice.countDocuments({ instituteId, isDeleted: false, status: "draft" }),
      countFeesByStatus({ instituteId, isDeleted: false }),
      getLatestNotices({ instituteId, role: "admin" }),
      Timetable.countDocuments({ instituteId, isDeleted: false, status: "active" }),
      Assignment.countDocuments({ instituteId, isDeleted: false, status: { $in: ["draft", "published"] } }),
      LibraryBook.countDocuments({ instituteId, isDeleted: false }),
      LibraryBook.aggregate([
        { $match: { instituteId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$availableCopies" } } },
      ]),
      BookIssue.countDocuments({ instituteId, isDeleted: false, status: { $in: ["issued", "overdue", "lost"] }, returnDate: null }),
      countOverdueIssues({ instituteId, isDeleted: false, status: { $in: ["issued", "overdue"] }, returnDate: null }),
      TransportVehicle.countDocuments({ instituteId, isDeleted: false }),
      TransportRoute.countDocuments({ instituteId, isDeleted: false, status: "active" }),
      TransportAllocation.countDocuments({ instituteId, isDeleted: false, status: "active" }),
      TransportVehicle.countDocuments({ instituteId, isDeleted: false, status: "maintenance" }),
      Hostel.countDocuments({ instituteId, isDeleted: false }),
      Hostel.countDocuments({ instituteId, isDeleted: false, status: "active" }),
      HostelBed.countDocuments({ instituteId, isDeleted: false, status: "available" }),
      HostelBed.countDocuments({ instituteId, isDeleted: false, status: "maintenance" }),
      HostelAllocation.countDocuments({ instituteId, isDeleted: false, status: "active" }),
      HostelOutpass.countDocuments({ instituteId, isDeleted: false, finalStatus: { $in: ["pending", "parent_approved"] } }),
      HostelComplaint.countDocuments({ instituteId, isDeleted: false, status: { $in: ["open", "in_progress"] } }),
    ]);

    res.json({
      stats: {
        totalSubjects,
        totalExams,
        todayAttendanceCount,
        pendingMarks,
        publishedResults,
        publishedNotices,
        draftNotices,
        pendingFees: feeSummary.pending,
        paidFees: feeSummary.paid,
        activeTimetables,
        activeAssignments,
        totalBooks,
        availableBooks: availableBooks[0]?.total || 0,
        issuedBooks,
        overdueBooks,
        totalVehicles,
        activeRoutes,
        transportStudents,
        vehiclesInMaintenance,
        totalHostels,
        activeHostels,
        availableBeds,
        bedsInMaintenance,
        hostelStudents,
        pendingHostelOutpasses,
        openHostelComplaints,
      },
      latestNotices,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherPhase4Stats = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const assignedGroups = (req.user.assignedAcademicGroups || []).map((value) => value._id || value);
    const teacherAssignments = await Assignment.find({
      instituteId,
      teacherId: req.user._id,
      isDeleted: false,
      status: { $in: ["draft", "published"] },
    }).select("_id");
    const teacherAssignmentIds = teacherAssignments.map((assignment) => assignment._id);

    const [assignedSubjects, attendanceMarkedToday, pendingMarksUpload, upcomingExams, latestNotices, todayTimetablePeriods, pendingSubmissions] = await Promise.all([
      Subject.countDocuments({ instituteId, teacherId: req.user._id, isDeleted: false }),
      Attendance.countDocuments({
        instituteId,
        markedBy: req.user._id,
        isDeleted: false,
        date: { $gte: today, $lt: tomorrow },
      }),
      Marks.countDocuments({ instituteId, uploadedBy: req.user._id, isDeleted: false, status: { $in: ["draft", "submitted"] } }),
      Exam.countDocuments({
        instituteId,
        academicGroupId: { $in: assignedGroups },
        isDeleted: false,
        startDate: { $gte: today },
      }),
      getLatestNotices({ instituteId, role: "teacher" }),
      countTeacherTodayPeriods(req.user._id, instituteId),
      AssignmentSubmission.countDocuments({
        instituteId,
        assignmentId: { $in: teacherAssignmentIds },
        isDeleted: false,
        status: { $in: ["submitted", "late"] },
      }),
    ]);

    res.json({
      stats: {
        assignedAcademicGroups: assignedGroups.length,
        assignedSubjects,
        attendanceMarkedToday,
        pendingMarksUpload,
        upcomingExams,
        todayTimetablePeriods,
        activeAssignments: teacherAssignmentIds.length,
        pendingSubmissions,
      },
      latestNotices,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentPhase4Stats = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    const attendanceRecords = await Attendance.find({
      instituteId: student.instituteId,
      "records.studentId": student._id,
      isDeleted: false,
    });
    let presentLike = 0;
    let total = 0;
    attendanceRecords.forEach((entry) => {
      const record = entry.records.find((item) => String(item.studentId) === String(student._id));
      if (!record) return;
      if (record.status === "present" || record.status === "late") presentLike += 1;
      total += 1;
    });
    const attendancePercentage = total ? Number(((presentLike / total) * 100).toFixed(2)) : 0;
    const [latestExam, latestResult, totalSubjects, latestNotices, studentFees, todayTimetable, pendingAssignments, studentBookIssues, transportAllocation, hostelAllocation, pendingOutpasses, openComplaints] = await Promise.all([
      Exam.findOne({ instituteId: student.instituteId, academicGroupId: student.academicGroupId, isDeleted: false }).sort({ startDate: -1 }),
      Marks.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "published" })
        .populate("examId", "examName")
        .sort({ createdAt: -1 }),
      Subject.countDocuments({ instituteId: student.instituteId, academicGroupId: student.academicGroupId, isDeleted: false }),
      getLatestNotices({ instituteId: student.instituteId, role: "student", academicGroupIds: student.academicGroupId ? [student.academicGroupId] : [] }),
      Fee.find({ instituteId: student.instituteId, studentId: student._id, isDeleted: false }).select("amount discount fine paidAmount dueDate"),
      countStudentTodayPeriods(student.instituteId, student.academicGroupId),
      Assignment.countDocuments({ instituteId: student.instituteId, academicGroupId: student.academicGroupId, isDeleted: false, status: "published" }),
      BookIssue.find({ instituteId: student.instituteId, studentId: student._id, isDeleted: false }).select("dueDate returnDate status"),
      TransportAllocation.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "active" }).populate("routeId", "routeName"),
      HostelAllocation.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "active" }).populate("roomId", "roomNumber"),
      HostelOutpass.countDocuments({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, finalStatus: { $in: ["pending", "parent_approved"] } }),
      HostelComplaint.countDocuments({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: { $in: ["open", "in_progress"] } }),
    ]);
    const pendingFees = studentFees.filter((fee) => ["unpaid", "partial", "overdue"].includes(getFeeStatus(fee))).length;
    const myIssuedBooks = studentBookIssues.filter((issue) => ["issued", "overdue", "lost"].includes(getIssueStatus(issue))).length;
    const myOverdueBooks = studentBookIssues.filter((issue) => getIssueStatus(issue) === "overdue").length;
    res.json({
      stats: {
        attendancePercentage,
        latestExam: latestExam?.examName || "N/A",
        latestResult: latestResult?.grade || "N/A",
        totalSubjects,
        pendingFees,
        todayTimetable,
        pendingAssignments,
        myIssuedBooks,
        myOverdueBooks,
        myTransportRoute: transportAllocation?.routeId?.routeName || "N/A",
        pickupStop: transportAllocation?.stopName || "N/A",
        myHostelRoom: hostelAllocation?.roomId?.roomNumber || "N/A",
        pendingOutpasses,
        openComplaints,
      },
      latestNotices,
    });
  } catch (error) {
    next(error);
  }
};

const getParentPhase4Stats = async (req, res, next) => {
  try {
    const linkedStudentIds = (req.user.linkedStudentIds || []).map((value) => value._id || value);
    const firstStudentId = linkedStudentIds[0];
    if (!firstStudentId) {
      return res.json({
        stats: {
          childAttendancePercentage: 0,
          latestChildResult: "N/A",
          upcomingExam: "N/A",
          childPendingFees: 0,
          childTransportRoute: "N/A",
          pickupStop: "N/A",
          childHostelRoom: "N/A",
          pendingOutpasses: 0,
          openComplaints: 0,
        },
        latestNotices: [],
      });
    }
    const student = await Student.findById(firstStudentId);
    if (!student) {
      return res.json({
        stats: {
          childAttendancePercentage: 0,
          latestChildResult: "N/A",
          upcomingExam: "N/A",
          childPendingFees: 0,
          childTransportRoute: "N/A",
          pickupStop: "N/A",
          childHostelRoom: "N/A",
          pendingOutpasses: 0,
          openComplaints: 0,
        },
        latestNotices: [],
      });
    }
    const attendanceRecords = await Attendance.find({
      instituteId: student.instituteId,
      "records.studentId": student._id,
      isDeleted: false,
    });
    let presentLike = 0;
    let total = 0;
    attendanceRecords.forEach((entry) => {
      const record = entry.records.find((item) => String(item.studentId) === String(student._id));
      if (!record) return;
      if (record.status === "present" || record.status === "late") presentLike += 1;
      total += 1;
    });
    const childAttendancePercentage = total ? Number(((presentLike / total) * 100).toFixed(2)) : 0;
    const linkedStudents = await Student.find({
      _id: { $in: linkedStudentIds },
      instituteId: student.instituteId,
      isDeleted: false,
    }).select("academicGroupId");
    const linkedAcademicGroupIds = linkedStudents.map((entry) => entry.academicGroupId).filter(Boolean);
    const [latestChildResult, upcomingExam, latestNotices, childFees, childTodayTimetable, childPendingAssignments, childBookIssues, childTransport, childHostelAllocation, childPendingOutpasses, childOpenComplaints] = await Promise.all([
      Marks.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "published" }).sort({ createdAt: -1 }),
      Exam.findOne({ instituteId: student.instituteId, academicGroupId: student.academicGroupId, isDeleted: false, startDate: { $gte: new Date() } }).sort({ startDate: 1 }),
      getLatestNotices({
        instituteId: student.instituteId,
        role: "parent",
        academicGroupIds: linkedAcademicGroupIds,
      }),
      Fee.find({ instituteId: student.instituteId, studentId: { $in: linkedStudentIds }, isDeleted: false }).select("amount discount fine paidAmount dueDate"),
      countStudentTodayPeriods(student.instituteId, student.academicGroupId),
      Assignment.countDocuments({ instituteId: student.instituteId, academicGroupId: student.academicGroupId, isDeleted: false, status: "published" }),
      BookIssue.find({ instituteId: student.instituteId, studentId: { $in: linkedStudentIds }, isDeleted: false }).select("dueDate returnDate status"),
      TransportAllocation.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "active" }).populate("routeId", "routeName"),
      HostelAllocation.findOne({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: "active" }).populate("roomId", "roomNumber"),
      HostelOutpass.countDocuments({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, finalStatus: { $in: ["pending", "parent_approved"] } }),
      HostelComplaint.countDocuments({ instituteId: student.instituteId, studentId: student._id, isDeleted: false, status: { $in: ["open", "in_progress"] } }),
    ]);
    const childPendingFees = childFees.filter((fee) => ["unpaid", "partial", "overdue"].includes(getFeeStatus(fee))).length;
    const childIssuedBooks = childBookIssues.filter((issue) => ["issued", "overdue", "lost"].includes(getIssueStatus(issue))).length;
    const childOverdueBooks = childBookIssues.filter((issue) => getIssueStatus(issue) === "overdue").length;

    res.json({
      stats: {
        childAttendancePercentage,
        latestChildResult: latestChildResult?.grade || "N/A",
        upcomingExam: upcomingExam?.examName || "N/A",
        childPendingFees,
        childTodayTimetable,
        childPendingAssignments,
        childIssuedBooks,
        childOverdueBooks,
        childTransportRoute: childTransport?.routeId?.routeName || "N/A",
        pickupStop: childTransport?.stopName || "N/A",
        childHostelRoom: childHostelAllocation?.roomId?.roomNumber || "N/A",
        pendingOutpasses: childPendingOutpasses,
        openComplaints: childOpenComplaints,
      },
      latestNotices,
    });
  } catch (error) {
    next(error);
  }
};

const getStaffPhase4Stats = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const canViewTransport = canManageTransport(req.user);
    const isDriver = isDriverUser(req.user);
    const canViewHostelStats = canManageHostel(req.user) || isHostelSecurityUser(req.user);
    const isHostelSecurity = isHostelSecurityUser(req.user);
    const driverRouteIdsPromise = isDriver
      ? TransportRoute.find({
          instituteId,
          driverId: req.user._id,
          isDeleted: false,
          status: "active",
        }).distinct("_id")
      : Promise.resolve([]);
    const [driverRouteIds, totalStaff, latestNotices, totalBooks, issuedBooks, overdueBooks, totalVehicles, activeRoutes, transportStudents, vehiclesInMaintenance, assignedDriverRoute, totalHostels, activeHostels, availableBeds, bedsInMaintenance, totalRooms, hostelStudents, pendingHostelOutpasses, openHostelComplaints] = await Promise.all([
      driverRouteIdsPromise,
      StaffMember.countDocuments({ instituteId, isDeleted: false }),
      getLatestNotices({ instituteId, role: "staff" }),
      canManageLibrary(req.user) ? LibraryBook.countDocuments({ instituteId, isDeleted: false }) : 0,
      canManageLibrary(req.user) ? BookIssue.countDocuments({ instituteId, isDeleted: false, status: { $in: ["issued", "overdue", "lost"] }, returnDate: null }) : 0,
      canManageLibrary(req.user) ? countOverdueIssues({ instituteId, isDeleted: false, status: { $in: ["issued", "overdue"] }, returnDate: null }) : 0,
      canViewTransport ? TransportVehicle.countDocuments({ instituteId, isDeleted: false }) : 0,
      canViewTransport ? TransportRoute.countDocuments({ instituteId, isDeleted: false, status: "active" }) : 0,
      canViewTransport ? TransportAllocation.countDocuments({ instituteId, isDeleted: false, status: "active" }) : 0,
      canViewTransport ? TransportVehicle.countDocuments({ instituteId, isDeleted: false, status: "maintenance" }) : 0,
      isDriver ? TransportRoute.findOne({ instituteId, driverId: req.user._id, isDeleted: false, status: "active" }).select("routeName routeCode") : null,
      canViewHostelStats ? Hostel.countDocuments({ instituteId, isDeleted: false }) : 0,
      canViewHostelStats ? Hostel.countDocuments({ instituteId, isDeleted: false, status: "active" }) : 0,
      canViewHostelStats ? HostelBed.countDocuments({ instituteId, isDeleted: false, status: "available" }) : 0,
      canViewHostelStats ? HostelBed.countDocuments({ instituteId, isDeleted: false, status: "maintenance" }) : 0,
      canViewHostelStats ? HostelRoom.countDocuments({ instituteId, isDeleted: false }) : 0,
      canManageHostel(req.user) ? HostelAllocation.countDocuments({ instituteId, isDeleted: false, status: "active" }) : 0,
      canManageHostel(req.user) ? HostelOutpass.countDocuments({ instituteId, isDeleted: false, finalStatus: { $in: ["pending", "parent_approved"] } }) : 0,
      canManageHostel(req.user) ? HostelComplaint.countDocuments({ instituteId, isDeleted: false, status: { $in: ["open", "in_progress"] } }) : 0,
    ]);
    const assignedDriverStudents = isDriver
      ? await TransportAllocation.countDocuments({
          instituteId,
          isDeleted: false,
          status: "active",
          routeId: { $in: driverRouteIds },
        })
      : 0;

    res.json({
      stats: {
        totalStaff,
        ...(canViewTransport
          ? {
              totalVehicles,
              activeRoutes,
              transportStudents,
              vehiclesInMaintenance,
            }
          : {}),
        ...(isDriver
          ? {
              myRoute: assignedDriverRoute?.routeCode || assignedDriverRoute?.routeName || "N/A",
              assignedStudents: assignedDriverStudents,
            }
          : {}),
        ...(canManageHostel(req.user)
          ? {
              totalHostels,
              availableBeds,
              bedsInMaintenance,
              hostelStudents,
              pendingHostelOutpasses,
              openHostelComplaints,
            }
          : {}),
        ...(isHostelSecurity
          ? {
              activeHostels,
              totalRooms,
            }
          : {}),
        ...(canManageLibrary(req.user)
          ? {
              totalBooks,
              issuedBooks,
              overdueBooks,
            }
          : {}),
      },
      latestNotices,
    });
  } catch (error) {
    next(error);
  }
};

export { getAdminPhase4Stats, getTeacherPhase4Stats, getStudentPhase4Stats, getParentPhase4Stats, getStaffPhase4Stats };
