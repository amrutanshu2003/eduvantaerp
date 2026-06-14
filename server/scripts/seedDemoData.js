import dotenv from "dotenv";
import connectDB from "../config/db.js";
import AcademicGroup from "../models/AcademicGroup.js";
import AcademicSettings from "../models/AcademicSettings.js";
import Admin from "../models/Admin.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Attendance from "../models/Attendance.js";
import BookIssue from "../models/BookIssue.js";
import ERPSettings from "../models/ERPSettings.js";
import Exam from "../models/Exam.js";
import Fee from "../models/Fee.js";
import FormSettings from "../models/FormSettings.js";
import Hostel from "../models/Hostel.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelBed from "../models/HostelBed.js";
import HostelComplaint from "../models/HostelComplaint.js";
import HostelOutpass from "../models/HostelOutpass.js";
import HostelRoom from "../models/HostelRoom.js";
import Institute from "../models/Institute.js";
import LabelSettings from "../models/LabelSettings.js";
import LibraryBook from "../models/LibraryBook.js";
import Marks from "../models/Marks.js";
import ModuleSettings from "../models/ModuleSettings.js";
import Notice from "../models/Notice.js";
import Notification from "../models/Notification.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Teacher from "../models/Teacher.js";
import Timetable from "../models/Timetable.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import TransportVehicle from "../models/TransportVehicle.js";
import UISettings from "../models/UISettings.js";

dotenv.config();

const DEMO_INSTITUTE_CODE = "EDVDEMO";
const DEMO_EMAIL_REGEX = /demo\+.*@eduvanta\.com$/i;

const defaultERPSettings = {
  appName: "Eduvanta Demo Campus",
  appShortName: "Eduvanta Demo",
  tagline: "Operational demo institute with realistic ERP workflows",
  logo: "",
  favicon: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  accentColor: "#2563eb",
  sidebarColor: "#0f172a",
  navbarColor: "#ffffff",
  backgroundColor: "#f8fafc",
  cardColor: "#ffffff",
  textColor: "#0f172a",
  buttonStyle: "rounded",
  themeMode: "system",
  loginLayout: "split",
  loginBackground: "",
  loginHeroTitle: "Eduvanta Demo Campus",
  loginHeroSubtitle: "Sign in to explore realistic ERP workflows",
  footerText: "Eduvanta Demo Campus ERP",
  enableDarkMode: true,
  enableCaptcha: true,
  enableRememberMe: true,
  enableForgotPassword: true,
  defaultLanguage: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

const defaultLabelSettings = {
  labels: {
    instituteLabel: "Institute",
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Faculty",
    parentLabel: "Guardian",
    studentLabel: "Student",
    staffLabel: "Staff",
    subjectLabel: "Subject",
    examLabel: "Exam",
    resultLabel: "Result",
    feeLabel: "Fee",
    noticeLabel: "Notice",
    timetableLabel: "Timetable",
    assignmentLabel: "Assignment",
    libraryLabel: "Library",
    transportLabel: "Transport",
    hostelLabel: "Hostel",
    attendanceLabel: "Attendance",
    marksLabel: "Marks",
  },
};

const defaultModuleSettings = {
  modules: {
    academics: true,
    students: true,
    teachers: true,
    parents: true,
    staff: true,
    subjects: true,
    attendance: true,
    exams: true,
    marks: true,
    fees: true,
    notices: true,
    timetable: true,
    assignments: true,
    library: true,
    transport: true,
    hostel: true,
    payroll: false,
    reports: true,
  },
};

const academicGroupsSeed = [
  {
    key: "grade9A",
    schoolLevel: "Secondary",
    className: "Class 9",
    section: "A",
  },
  {
    key: "grade9B",
    schoolLevel: "Secondary",
    className: "Class 9",
    section: "B",
  },
  {
    key: "grade10A",
    schoolLevel: "Secondary",
    className: "Class 10",
    section: "A",
  },
  {
    key: "grade10B",
    schoolLevel: "Secondary",
    className: "Class 10",
    section: "B",
  },
];

const teachersSeed = [
  { key: "teacher1", name: "Aarav Sharma", email: "demo+teacher1@eduvanta.com", phone: "9800000001", employeeId: "T-DEM-001", qualification: "M.Sc Mathematics", experience: "8 years", department: "Mathematics" },
  { key: "teacher2", name: "Diya Verma", email: "demo+teacher2@eduvanta.com", phone: "9800000002", employeeId: "T-DEM-002", qualification: "M.A English", experience: "6 years", department: "English" },
  { key: "teacher3", name: "Kabir Nair", email: "demo+teacher3@eduvanta.com", phone: "9800000003", employeeId: "T-DEM-003", qualification: "M.Sc Physics", experience: "10 years", department: "Science" },
  { key: "teacher4", name: "Meera Joshi", email: "demo+teacher4@eduvanta.com", phone: "9800000004", employeeId: "T-DEM-004", qualification: "M.Sc Chemistry", experience: "7 years", department: "Science" },
  { key: "teacher5", name: "Rohan Gupta", email: "demo+teacher5@eduvanta.com", phone: "9800000005", employeeId: "T-DEM-005", qualification: "M.Com", experience: "9 years", department: "Commerce" },
  { key: "teacher6", name: "Isha Khan", email: "demo+teacher6@eduvanta.com", phone: "9800000006", employeeId: "T-DEM-006", qualification: "MCA", experience: "5 years", department: "Computer Science" },
  { key: "teacher7", name: "Sanjay Patel", email: "demo+teacher7@eduvanta.com", phone: "9800000007", employeeId: "T-DEM-007", qualification: "M.A History", experience: "11 years", department: "Social Science" },
  { key: "teacher8", name: "Nisha Rao", email: "demo+teacher8@eduvanta.com", phone: "9800000008", employeeId: "T-DEM-008", qualification: "M.P.Ed", experience: "4 years", department: "Physical Education" },
];

const subjectsSeed = [
  { groupKey: "grade9A", subjectName: "Mathematics", subjectCode: "C9A-MATH", subjectType: "core", teacherKey: "teacher1", totalMarks: 100, passingMarks: 35 },
  { groupKey: "grade9A", subjectName: "Physics Lab", subjectCode: "C9A-PHYL", subjectType: "practical", teacherKey: "teacher3", totalMarks: 50, passingMarks: 20 },
  { groupKey: "grade9B", subjectName: "English Literature", subjectCode: "C9B-ENG", subjectType: "core", teacherKey: "teacher2", totalMarks: 100, passingMarks: 35 },
  { groupKey: "grade9B", subjectName: "Chemistry Lab", subjectCode: "C9B-CHEML", subjectType: "lab", teacherKey: "teacher4", totalMarks: 50, passingMarks: 20 },
  { groupKey: "grade10A", subjectName: "Accountancy", subjectCode: "C10A-ACC", subjectType: "core", teacherKey: "teacher5", totalMarks: 100, passingMarks: 35 },
  { groupKey: "grade10A", subjectName: "Computer Applications", subjectCode: "C10A-COMP", subjectType: "practical", teacherKey: "teacher6", totalMarks: 100, passingMarks: 35 },
  { groupKey: "grade10B", subjectName: "History", subjectCode: "C10B-HIST", subjectType: "core", teacherKey: "teacher7", totalMarks: 100, passingMarks: 35 },
  { groupKey: "grade10B", subjectName: "Physical Education", subjectCode: "C10B-PE", subjectType: "practical", teacherKey: "teacher8", totalMarks: 50, passingMarks: 20 },
];

const weekdayPeriods = {
  monday: [
    ["09:00", "09:45"],
    ["09:50", "10:35"],
  ],
  tuesday: [
    ["10:00", "10:45"],
    ["10:50", "11:35"],
  ],
  wednesday: [
    ["09:15", "10:00"],
    ["10:05", "10:50"],
  ],
  thursday: [
    ["11:00", "11:45"],
    ["11:50", "12:35"],
  ],
  friday: [
    ["08:50", "09:35"],
    ["09:40", "10:25"],
  ],
};

const buildNoticeSeed = (instituteId, adminId, groupMap) => [
  ["Quarterly PTM Schedule", "Parents are invited for the quarterly progress review meeting this Saturday.", "academic", "parents", null, "high", 2],
  ["Attendance Improvement Drive", "Students with attendance below 75% must meet their class mentors this week.", "academic", "students", null, "high", 1],
  ["Staff Duty Rotation", "Updated corridor and assembly supervision roster has been published for staff members.", "general", "staff", null, "normal", 3],
  ["Faculty Workshop", "Teachers will attend a blended-learning workshop in the seminar hall on Friday.", "event", "teachers", null, "normal", 4],
  ["Fee Reminder", "Installment 2 fee reminders have been issued for pending and partial records.", "fees", "students", null, "urgent", 5],
  ["Class 9A Lab Safety Advisory", "Carry lab coats and safety notebooks for practical sessions this week.", "academic", "academic_group", groupMap.grade9A._id, "normal", 0],
  ["Board Preparation Calendar", "Class 10 revision blocks and mock assessments begin next Monday.", "exam", "academic_group", groupMap.grade10A._id, "high", 6],
  ["Transport Route Adjustment", "Route 2 pickup timings are shifted by 10 minutes due to road maintenance.", "general", "all", null, "normal", 7],
].map(([title, description, noticeType, audience, academicGroupId, priority, daysAgo]) => ({
  instituteId,
  title,
  description,
  noticeType,
  audience,
  academicGroupId,
  priority,
  publishDate: daysAgo === 0 ? new Date() : new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  status: "published",
  createdBy: adminId,
  createdByModel: "Admin",
}));

const seedDemoData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for demo data seeding...");

    const oldInstitutes = await Institute.find({ instituteCode: DEMO_INSTITUTE_CODE }).select("_id");
    const oldInstituteIds = oldInstitutes.map((item) => item._id);

    if (oldInstituteIds.length > 0) {
      console.log("Removing previous demo institute records...");
      await Promise.all([
        AcademicSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        AcademicGroup.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Admin.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Assignment.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        AssignmentSubmission.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Attendance.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        BookIssue.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        ERPSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Exam.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Fee.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        FormSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Hostel.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelAllocation.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelBed.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelComplaint.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelOutpass.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelRoom.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Institute.deleteMany({ _id: { $in: oldInstituteIds } }),
        LabelSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        LibraryBook.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Marks.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        ModuleSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Notice.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Notification.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Parent.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        StaffMember.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Student.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Subject.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Teacher.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Timetable.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        TransportAllocation.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        TransportRoute.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        TransportVehicle.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        UISettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
      ]);
    }

    await Promise.all([
      SuperAdmin.deleteMany({ email: DEMO_EMAIL_REGEX }),
      Admin.deleteMany({ email: DEMO_EMAIL_REGEX }),
      Teacher.deleteMany({ email: DEMO_EMAIL_REGEX }),
      Student.deleteMany({ email: DEMO_EMAIL_REGEX }),
      Parent.deleteMany({ email: DEMO_EMAIL_REGEX }),
      StaffMember.deleteMany({ email: DEMO_EMAIL_REGEX }),
    ]);

    const superAdmin = await SuperAdmin.create({
      name: "Demo Super Admin",
      email: "demo+superadmin@eduvanta.com",
      phone: "9810000000",
      password: "Demo@123",
      permissions: ["*"],
      status: "active",
    });

    const institute = await Institute.create({
      name: "Eduvanta Demo Senior Secondary School",
      instituteCode: DEMO_INSTITUTE_CODE,
      instituteType: "school",
      email: "demo+institute@eduvanta.com",
      phone: "9810000001",
      address: "Plot 12, Knowledge Avenue, New Delhi",
      headName: "Dr. Meenal Kapoor",
      plan: "premium",
      paymentStatus: "paid",
      status: "active",
      createdBy: superAdmin._id,
      createdByModel: "SuperAdmin",
    });

    await Promise.all([
      ERPSettings.create({ ...defaultERPSettings, instituteId: institute._id, createdBy: superAdmin._id }),
      LabelSettings.create({ ...defaultLabelSettings, instituteId: institute._id }),
      ModuleSettings.create({ ...defaultModuleSettings, instituteId: institute._id }),
      FormSettings.create({ instituteId: institute._id, entity: "student", fields: [] }),
      UISettings.create({
        instituteId: institute._id,
        appName: "Eduvanta Demo Campus",
        primaryColor: "#0f766e",
        secondaryColor: "#f59e0b",
        sidebarColor: "#0f172a",
        buttonStyle: "rounded",
        themeMode: "system",
        footerText: "Eduvanta Demo Campus ERP",
        loginHeroTitle: "Realistic demo ERP workspace",
        loginHeroDescription: "Explore attendance, academics, assignments, fees, transport, hostel, library, and notifications in one seeded institute.",
        loginFormDescription: "Use the demo accounts from README to sign in as admin, faculty, student, parent, or staff.",
        captchaEnabled: true,
      }),
      AcademicSettings.create({
        instituteId: institute._id,
        academicGroupLabel: "Class",
        subGroupLabel: "Section",
        teacherLabel: "Faculty",
        parentLabel: "Guardian",
        studentLabel: "Student",
        levels: [
          { name: "Secondary", order: 1, status: "active" },
          { name: "Higher Secondary", order: 2, status: "active" },
        ],
        fields: [],
      }),
    ]);

    const adminPrimary = await Admin.create({
      name: "Demo Institute Admin",
      email: "demo+admin1@eduvanta.com",
      phone: "9810000002",
      password: "Demo@123",
      role: "admin",
      permissions: ["*"],
      status: "active",
      instituteId: institute._id,
      createdBy: superAdmin._id,
      createdByModel: "SuperAdmin",
    });

    const adminOperations = await Admin.create({
      name: "Demo Operations Admin",
      email: "demo+admin2@eduvanta.com",
      phone: "9810000003",
      password: "Demo@123",
      role: "admin",
      permissions: ["students.manage", "teachers.manage", "attendance.manage", "fees.manage", "notices.manage"],
      status: "active",
      instituteId: institute._id,
      createdBy: superAdmin._id,
      createdByModel: "SuperAdmin",
    });

    const groupMap = {};
    for (const groupSeed of academicGroupsSeed) {
      groupMap[groupSeed.key] = await AcademicGroup.create({
        instituteId: institute._id,
        instituteType: "school",
        schoolLevel: groupSeed.schoolLevel,
        className: groupSeed.className,
        section: groupSeed.section,
        status: "active",
        createdBy: adminPrimary._id,
      });
    }

    const teacherMap = {};
    for (const [index, seed] of teachersSeed.entries()) {
      const assignedAcademicGroups = [groupMap[academicGroupsSeed[Math.floor(index / 2)].key]._id];
      teacherMap[seed.key] = await Teacher.create({
        ...seed,
        password: "Demo@123",
        assignedAcademicGroups,
        status: "active",
        instituteId: institute._id,
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
    }

    groupMap.grade9A.mentorOrClassTeacher = teacherMap.teacher1._id;
    groupMap.grade9B.mentorOrClassTeacher = teacherMap.teacher2._id;
    groupMap.grade10A.mentorOrClassTeacher = teacherMap.teacher5._id;
    groupMap.grade10B.mentorOrClassTeacher = teacherMap.teacher7._id;
    await Promise.all(Object.values(groupMap).map((group) => group.save()));

    const staffSeeds = [
      { key: "staff1", name: "Harsh Librarian", email: "demo+staff1@eduvanta.com", phone: "9810000011", staffId: "S-DEM-001", designation: "librarian", permissions: ["library.manage"] },
      { key: "staff2", name: "Prerna Driver", email: "demo+staff2@eduvanta.com", phone: "9810000012", staffId: "S-DEM-002", designation: "driver", permissions: ["transport.view"] },
      { key: "staff3", name: "Vikram Driver", email: "demo+staff3@eduvanta.com", phone: "9810000013", staffId: "S-DEM-003", designation: "driver", permissions: ["transport.view"] },
      { key: "staff4", name: "Sonal Driver", email: "demo+staff4@eduvanta.com", phone: "9810000014", staffId: "S-DEM-004", designation: "driver", permissions: ["transport.view"] },
      { key: "staff5", name: "Neha Warden", email: "demo+staff5@eduvanta.com", phone: "9810000015", staffId: "S-DEM-005", designation: "hostel_warden", permissions: ["hostel.manage"] },
      { key: "staff6", name: "Amit Warden", email: "demo+staff6@eduvanta.com", phone: "9810000016", staffId: "S-DEM-006", designation: "hostel_warden", permissions: ["hostel.manage"] },
      { key: "staff7", name: "Tanya Accountant", email: "demo+staff7@eduvanta.com", phone: "9810000017", staffId: "S-DEM-007", designation: "accountant", permissions: ["fees.manage"] },
      { key: "staff8", name: "Ritesh Reception", email: "demo+staff8@eduvanta.com", phone: "9810000018", staffId: "S-DEM-008", designation: "receptionist", permissions: ["student.view", "parent.view"] },
    ];

    const staffMap = {};
    for (const seed of staffSeeds) {
      staffMap[seed.key] = await StaffMember.create({
        ...seed,
        password: "Demo@123",
        instituteId: institute._id,
        joiningDate: new Date("2024-04-01"),
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
    }

    const subjectMap = {};
    for (const seed of subjectsSeed) {
      subjectMap[seed.subjectCode] = await Subject.create({
        instituteId: institute._id,
        academicGroupId: groupMap[seed.groupKey]._id,
        subjectName: seed.subjectName,
        subjectCode: seed.subjectCode,
        subjectType: seed.subjectType,
        teacherId: teacherMap[seed.teacherKey]._id,
        totalMarks: seed.totalMarks,
        passingMarks: seed.passingMarks,
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
    }

    const parents = [];
    const students = [];
    for (let index = 0; index < 20; index += 1) {
      const parent = await Parent.create({
        name: `Demo Guardian ${index + 1}`,
        email: `demo+parent${index + 1}@eduvanta.com`,
        phone: `982${String(index + 1).padStart(7, "0")}`,
        password: "Demo@123",
        relation: index % 3 === 0 ? "mother" : "father",
        address: `Block ${index + 1}, Eduvanta Residency`,
        status: "active",
        instituteId: institute._id,
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
      parents.push(parent);

      for (let childOffset = 0; childOffset < 2; childOffset += 1) {
        const studentIndex = index * 2 + childOffset;
        const groupSeed = academicGroupsSeed[Math.floor(studentIndex / 10)];
        const student = await Student.create({
          name: `Demo Student ${studentIndex + 1}`,
          email: `demo+student${studentIndex + 1}@eduvanta.com`,
          phone: `983${String(studentIndex + 1).padStart(7, "0")}`,
          password: "Demo@123",
          rollNumber: `EDV${String(studentIndex + 1).padStart(3, "0")}`,
          admissionNumber: `ADM-EDV-2026-${String(studentIndex + 1).padStart(3, "0")}`,
          academicGroupId: groupMap[groupSeed.key]._id,
          admissionDate: new Date("2026-04-01"),
          gender: studentIndex % 2 === 0 ? "male" : "female",
          address: `Hostel/Transport Cluster ${studentIndex + 1}`,
          status: "active",
          instituteId: institute._id,
          parentIds: [parent._id],
          createdBy: adminPrimary._id,
          createdByModel: "Admin",
        });
        students.push(student);
        parent.linkedStudentIds.push(student._id);
      }

      await parent.save();
    }

    const studentsByGroup = academicGroupsSeed.reduce((accumulator, groupSeed) => {
      accumulator[groupSeed.key] = students.filter((student) => String(student.academicGroupId) === String(groupMap[groupSeed.key]._id));
      return accumulator;
    }, {});

    const hostelGirls = await Hostel.create({
      instituteId: institute._id,
      hostelName: "Shakti Girls Hostel",
      hostelCode: "EDV-GH",
      hostelType: "girls",
      totalFloors: 2,
      address: "North Hostel Wing",
      wardenId: staffMap.staff5._id,
      contactNumber: "9890000001",
      status: "active",
      createdBy: adminPrimary._id,
      createdByModel: "Admin",
    });

    const hostelBoys = await Hostel.create({
      instituteId: institute._id,
      hostelName: "Udaan Boys Hostel",
      hostelCode: "EDV-BH",
      hostelType: "boys",
      totalFloors: 2,
      address: "South Hostel Wing",
      wardenId: staffMap.staff6._id,
      contactNumber: "9890000002",
      status: "active",
      createdBy: adminPrimary._id,
      createdByModel: "Admin",
    });

    const hostels = [hostelGirls, hostelBoys];
    const hostelRooms = [];
    const hostelBeds = [];

    for (const [hostelIndex, hostel] of hostels.entries()) {
      for (let roomIndex = 1; roomIndex <= 4; roomIndex += 1) {
        const room = await HostelRoom.create({
          instituteId: institute._id,
          hostelId: hostel._id,
          roomNumber: `${hostelIndex === 0 ? "G" : "B"}-${100 + roomIndex}`,
          floorNumber: roomIndex <= 2 ? 1 : 2,
          roomType: "triple",
          capacity: 3,
          occupiedBeds: 0,
          status: "available",
          createdBy: adminPrimary._id,
          createdByModel: "Admin",
        });
        hostelRooms.push(room);

        for (let bedIndex = 1; bedIndex <= 3; bedIndex += 1) {
          const bed = await HostelBed.create({
            instituteId: institute._id,
            hostelId: hostel._id,
            roomId: room._id,
            bedNumber: `${room.roomNumber}-${String.fromCharCode(64 + bedIndex)}`,
            status: "available",
            createdBy: adminPrimary._id,
            createdByModel: "Admin",
          });
          hostelBeds.push(bed);
        }
      }
    }

    const hostelStudents = students.slice(0, 6);
    const hostelAllocations = [];
    for (const [index, student] of hostelStudents.entries()) {
      const room = hostelRooms[index];
      const bed = hostelBeds.find((item) => String(item.roomId) === String(room._id) && item.status === "available");
      room.occupiedBeds += 1;
      room.status = room.occupiedBeds >= room.capacity ? "full" : "available";
      bed.status = "occupied";
      bed.allocatedStudentId = student._id;
      await Promise.all([room.save(), bed.save()]);

      const allocation = await HostelAllocation.create({
        instituteId: institute._id,
        studentId: student._id,
        hostelId: room.hostelId,
        roomId: room._id,
        bedId: bed._id,
        allocationDate: new Date("2026-04-05"),
        monthlyFee: 4500,
        securityDeposit: 5000,
        status: "active",
        remarks: "Demo hostel allocation",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
      hostelAllocations.push(allocation);
    }

    await HostelComplaint.create({
      instituteId: institute._id,
      studentId: hostelStudents[0]._id,
      hostelAllocationId: hostelAllocations[0]._id,
      complaintType: "maintenance",
      title: "Study lamp not working",
      description: "Bedside study lamp in room needs electrical repair.",
      priority: "high",
      assignedTo: staffMap.staff5._id,
      status: "in_progress",
      createdBy: hostelStudents[0]._id,
      createdByModel: "Student",
      updatedBy: staffMap.staff5._id,
      updatedByModel: "StaffMember",
    });

    await HostelComplaint.create({
      instituteId: institute._id,
      studentId: hostelStudents[1]._id,
      hostelAllocationId: hostelAllocations[1]._id,
      complaintType: "cleaning",
      title: "Washroom cleaning request",
      description: "Daily cleaning missed on the second floor corridor.",
      priority: "normal",
      assignedTo: staffMap.staff6._id,
      status: "open",
      createdBy: hostelStudents[1]._id,
      createdByModel: "Student",
    });

    await HostelOutpass.create({
      instituteId: institute._id,
      studentId: hostelStudents[0]._id,
      hostelAllocationId: hostelAllocations[0]._id,
      reason: "Weekend family visit",
      destination: "Noida Sector 62",
      fromDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      parentApprovalRequired: true,
      parentApprovalStatus: "approved",
      parentApprovedBy: parents[0]._id,
      parentApprovedAt: new Date(),
      wardenApprovalStatus: "pending",
      finalStatus: "parent_approved",
      createdBy: hostelStudents[0]._id,
      createdByModel: "Student",
    });

    await HostelOutpass.create({
      instituteId: institute._id,
      studentId: hostelStudents[2]._id,
      hostelAllocationId: hostelAllocations[2]._id,
      reason: "Medical appointment",
      destination: "City Hospital",
      fromDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
      parentApprovalRequired: true,
      parentApprovalStatus: "pending",
      wardenApprovalStatus: "pending",
      finalStatus: "pending",
      createdBy: hostelStudents[2]._id,
      createdByModel: "Student",
    });

    const transportVehicles = await Promise.all([
      TransportVehicle.create({
        instituteId: institute._id,
        vehicleNumber: "DL01AB1234",
        vehicleType: "bus",
        capacity: 42,
        driverId: staffMap.staff2._id,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
      TransportVehicle.create({
        instituteId: institute._id,
        vehicleNumber: "DL01AB2234",
        vehicleType: "bus",
        capacity: 38,
        driverId: staffMap.staff3._id,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
      TransportVehicle.create({
        instituteId: institute._id,
        vehicleNumber: "DL01AB3234",
        vehicleType: "van",
        capacity: 22,
        driverId: staffMap.staff4._id,
        status: "maintenance",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
    ]);

    const transportRoutes = await Promise.all([
      TransportRoute.create({
        instituteId: institute._id,
        routeName: "Route 1 - East City",
        routeCode: "EDV-R1",
        vehicleId: transportVehicles[0]._id,
        driverId: staffMap.staff2._id,
        startPoint: "Mayur Vihar",
        endPoint: "Demo Campus",
        stops: [
          { stopName: "Mayur Vihar Phase 1", pickupTime: "07:05 AM", dropTime: "02:35 PM", stopOrder: 1 },
          { stopName: "Akshardham Stop", pickupTime: "07:20 AM", dropTime: "02:20 PM", stopOrder: 2 },
        ],
        monthlyFee: 1900,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
      TransportRoute.create({
        instituteId: institute._id,
        routeName: "Route 2 - North City",
        routeCode: "EDV-R2",
        vehicleId: transportVehicles[1]._id,
        driverId: staffMap.staff3._id,
        startPoint: "Model Town",
        endPoint: "Demo Campus",
        stops: [
          { stopName: "Civil Lines", pickupTime: "07:00 AM", dropTime: "02:45 PM", stopOrder: 1 },
          { stopName: "GTB Nagar", pickupTime: "07:15 AM", dropTime: "02:30 PM", stopOrder: 2 },
        ],
        monthlyFee: 2100,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
      TransportRoute.create({
        instituteId: institute._id,
        routeName: "Route 3 - South Extension",
        routeCode: "EDV-R3",
        vehicleId: transportVehicles[2]._id,
        driverId: staffMap.staff4._id,
        startPoint: "Lajpat Nagar",
        endPoint: "Demo Campus",
        stops: [
          { stopName: "South Ex Part I", pickupTime: "07:10 AM", dropTime: "02:40 PM", stopOrder: 1 },
          { stopName: "INA Market", pickupTime: "07:25 AM", dropTime: "02:25 PM", stopOrder: 2 },
        ],
        monthlyFee: 2200,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      }),
    ]);

    for (let index = 0; index < 9; index += 1) {
      const route = transportRoutes[index % transportRoutes.length];
      const stop = route.stops[index % route.stops.length];
      await TransportAllocation.create({
        instituteId: institute._id,
        studentId: students[8 + index]._id,
        routeId: route._id,
        stopName: stop.stopName,
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        monthlyFee: route.monthlyFee,
        startDate: new Date("2026-04-03"),
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
    }

    const books = [];
    for (let index = 0; index < 20; index += 1) {
      const subject = Object.values(subjectMap)[index % Object.values(subjectMap).length];
      const groupId = subject.academicGroupId;
      const book = await LibraryBook.create({
        instituteId: institute._id,
        title: `Demo Library Book ${index + 1}`,
        author: index % 2 === 0 ? "Pearson Editorial" : "Oxford Academic Team",
        isbn: `97800000${String(index + 1).padStart(5, "0")}`,
        category: index % 4 === 0 ? "reference" : index % 3 === 0 ? "research" : "textbook",
        subjectId: subject._id,
        academicGroupId: groupId,
        publisher: "Eduvanta Press",
        edition: `202${index % 4 + 2}`,
        language: "English",
        shelfNumber: `S-${String(index + 1).padStart(2, "0")}`,
        totalCopies: 6,
        availableCopies: 6,
        status: "active",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
      });
      books.push(book);
    }

    const issuePlan = [
      { student: students[0], book: books[0], status: "issued", dueOffset: 5 },
      { student: students[1], book: books[1], status: "overdue", dueOffset: -3 },
      { student: students[2], book: books[2], status: "returned", dueOffset: -8, returnOffset: -2 },
      { student: students[3], book: books[3], status: "issued", dueOffset: 7 },
      { student: students[4], book: books[4], status: "overdue", dueOffset: -1 },
      { student: students[5], book: books[5], status: "returned", dueOffset: -10, returnOffset: -4 },
      { student: students[6], book: books[6], status: "issued", dueOffset: 9 },
      { student: students[7], book: books[7], status: "issued", dueOffset: 3 },
    ];

    for (const issueSeed of issuePlan) {
      await BookIssue.create({
        instituteId: institute._id,
        bookId: issueSeed.book._id,
        studentId: issueSeed.student._id,
        issuedBy: staffMap.staff1._id,
        issuedByModel: "StaffMember",
        issueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + issueSeed.dueOffset * 24 * 60 * 60 * 1000),
        returnDate: issueSeed.returnOffset ? new Date(Date.now() + issueSeed.returnOffset * 24 * 60 * 60 * 1000) : null,
        fineAmount: issueSeed.status === "overdue" ? 120 : 0,
        status: issueSeed.status,
        remarks: "Demo circulation record",
        createdBy: adminPrimary._id,
        createdByModel: "Admin",
        updatedBy: staffMap.staff1._id,
        updatedByModel: "StaffMember",
      });

      if (issueSeed.status !== "returned") {
        issueSeed.book.availableCopies -= 1;
        await issueSeed.book.save();
      }
    }

    const timetableDays = Object.keys(weekdayPeriods);
    for (const groupSeed of academicGroupsSeed) {
      const groupSubjects = subjectsSeed.filter((subject) => subject.groupKey === groupSeed.key);
      for (const day of timetableDays) {
        const periods = groupSubjects.map((subjectSeed, index) => {
          const [startTime, endTime] = weekdayPeriods[day][index];
          const subject = subjectMap[subjectSeed.subjectCode];
          return {
            periodNumber: index + 1,
            subjectId: subject._id,
            teacherId: teacherMap[subjectSeed.teacherKey]._id,
            startTime,
            endTime,
            roomNumber: `${groupMap[groupSeed.key].className}-${groupSeed.section}`,
            type: subjectSeed.subjectType === "practical" || subjectSeed.subjectType === "lab" ? "practical" : "theory",
          };
        });

        await Timetable.create({
          instituteId: institute._id,
          academicGroupId: groupMap[groupSeed.key]._id,
          dayOfWeek: day,
          periods,
          status: "active",
          createdBy: adminPrimary._id,
          createdByModel: "Admin",
        });
      }
    }

    const exams = [];
    const examSeeds = [
      { name: "Periodic Assessment - Class 9A", groupKey: "grade9A", type: "unit_test", startOffset: -20, endOffset: -18, status: "published" },
      { name: "Lab Skills Assessment - Class 10A", groupKey: "grade10A", type: "practical", startOffset: -12, endOffset: -11, status: "published" },
      { name: "Mid Term Review - Class 10B", groupKey: "grade10B", type: "mid_term", startOffset: 7, endOffset: 10, status: "scheduled" },
    ];

    for (const seed of examSeeds) {
      const exam = await Exam.create({
        instituteId: institute._id,
        academicGroupId: groupMap[seed.groupKey]._id,
        examName: seed.name,
        examType: seed.type,
        startDate: new Date(Date.now() + seed.startOffset * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + seed.endOffset * 24 * 60 * 60 * 1000),
        status: seed.status,
        createdBy: adminPrimary._id,
      });
      exams.push(exam);
    }

    for (const student of studentsByGroup.grade9A) {
      const marksScore = 58 + (Number(student.rollNumber.slice(-2)) % 28);
      await Marks.create({
        instituteId: institute._id,
        examId: exams[0]._id,
        academicGroupId: groupMap.grade9A._id,
        subjectId: subjectMap["C9A-MATH"]._id,
        studentId: student._id,
        marksObtained: marksScore,
        totalMarks: 100,
        passingMarks: 35,
        grade: marksScore >= 85 ? "A+" : marksScore >= 70 ? "A" : marksScore >= 60 ? "B+" : "B",
        remarks: "Consistent classroom performance",
        uploadedBy: teacherMap.teacher1._id,
        uploadedByModel: "Teacher",
        status: "published",
      });
    }

    for (let index = 0; index < 10; index += 1) {
      const subjectSeed = subjectsSeed[index % subjectsSeed.length];
      const subject = subjectMap[subjectSeed.subjectCode];
      const assignment = await Assignment.create({
        instituteId: institute._id,
        academicGroupId: subject.academicGroupId,
        subjectId: subject._id,
        teacherId: teacherMap[subjectSeed.teacherKey]._id,
        title: `${subject.subjectName} Task ${index + 1}`,
        description: index % 2 === 0 ? "Complete the worksheet and revise the supporting concepts." : "Submit the practical/lab notebook with observations and conclusion.",
        dueDate: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000),
        maxMarks: subjectSeed.subjectType === "core" ? 20 : 15,
        assignmentType: subjectSeed.subjectType === "core" ? "assignment" : "lab_work",
        status: "published",
        createdBy: teacherMap[subjectSeed.teacherKey]._id,
      });

      const groupStudents = students.filter((student) => String(student.academicGroupId) === String(subject.academicGroupId));
      for (let submissionIndex = 0; submissionIndex < 5; submissionIndex += 1) {
        const student = groupStudents[submissionIndex];
        if (!student) continue;
        const status = submissionIndex % 3 === 0 ? "reviewed" : submissionIndex % 2 === 0 ? "late" : "submitted";
        await AssignmentSubmission.create({
          instituteId: institute._id,
          assignmentId: assignment._id,
          studentId: student._id,
          answerText: "Demo answer submission uploaded for dashboard and list testing.",
          submittedAt: new Date(Date.now() - submissionIndex * 24 * 60 * 60 * 1000),
          status,
          marksObtained: status === "reviewed" ? 12 + submissionIndex : null,
          feedback: status === "reviewed" ? "Well structured response." : "",
          reviewedBy: status === "reviewed" ? teacherMap[subjectSeed.teacherKey]._id : null,
        });
      }
    }

    await Notice.insertMany(buildNoticeSeed(institute._id, adminPrimary._id, groupMap));

    for (const [index, student] of students.entries()) {
      const statusCycle = index % 4;
      const dueDate = new Date(Date.now() + (statusCycle - 2) * 8 * 24 * 60 * 60 * 1000);
      const tuitionAmount = 18500;
      const tuitionPaid = statusCycle === 0 ? tuitionAmount : statusCycle === 1 ? 12000 : 0;
      const tuitionStatus = statusCycle === 0 ? "paid" : statusCycle === 1 ? "partial" : dueDate < new Date() ? "overdue" : "unpaid";

      await Fee.create({
        instituteId: institute._id,
        studentId: student._id,
        academicGroupId: student.academicGroupId,
        feeType: "tuition",
        title: "Annual Tuition Installment",
        description: "Core academic fee for the seeded demo institute.",
        amount: tuitionAmount,
        discount: index % 5 === 0 ? 1000 : 0,
        fine: tuitionStatus === "overdue" ? 250 : 0,
        paidAmount: tuitionPaid,
        dueDate,
        paymentDate: tuitionPaid > 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
        paymentMethod: tuitionPaid > 0 ? "upi" : "none",
        transactionId: tuitionPaid > 0 ? `RCPT-EDV-${String(index + 1).padStart(3, "0")}` : "",
        status: tuitionStatus,
        createdBy: adminOperations._id,
      });
    }

    for (let index = 0; index < 9; index += 1) {
      await Fee.create({
        instituteId: institute._id,
        studentId: students[8 + index]._id,
        academicGroupId: students[8 + index].academicGroupId,
        feeType: "transport",
        title: "Transport Fee",
        description: "Transport allocation fee linked to demo route allocation.",
        amount: 2100,
        paidAmount: index % 2 === 0 ? 2100 : 0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        paymentDate: index % 2 === 0 ? new Date() : null,
        paymentMethod: index % 2 === 0 ? "online" : "none",
        transactionId: index % 2 === 0 ? `TRN-EDV-${index + 1}` : "",
        status: index % 2 === 0 ? "paid" : "unpaid",
        createdBy: adminOperations._id,
      });
    }

    for (let index = 0; index < hostelStudents.length; index += 1) {
      await Fee.create({
        instituteId: institute._id,
        studentId: hostelStudents[index]._id,
        academicGroupId: hostelStudents[index].academicGroupId,
        feeType: "hostel",
        title: "Hostel Monthly Fee",
        description: "Hostel stay charge for the active allocation.",
        amount: 4500,
        paidAmount: index % 2 === 0 ? 4500 : 2200,
        dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        paymentDate: index % 2 === 0 ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paymentMethod: "upi",
        transactionId: `HST-EDV-${index + 1}`,
        status: index % 2 === 0 ? "paid" : "partial",
        createdBy: adminOperations._id,
      });
    }

    for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - dayOffset);

      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      if (dayName === "sunday") {
        continue;
      }

      for (const subjectSeed of subjectsSeed) {
        const subject = subjectMap[subjectSeed.subjectCode];
        const groupStudents = students.filter((student) => String(student.academicGroupId) === String(subject.academicGroupId));
        const isPractical = subject.subjectType === "practical" || subject.subjectType === "lab";
        const attendanceCount = isPractical ? 2 : dayOffset % 5 === 0 ? 2 : 1;
        const periods = weekdayPeriods[dayName] || [["09:00", "09:45"]];
        const subjectSlot = subjectsSeed.filter((item) => item.groupKey === subjectSeed.groupKey).findIndex((item) => item.subjectCode === subjectSeed.subjectCode);
        const [startTime, endTime] = periods[Math.max(subjectSlot, 0)] || periods[0];

        const records = groupStudents.map((student, index) => {
          const seedValue = dayOffset + index + subjectSeed.subjectCode.length;
          let status = "present";
          if (seedValue % 13 === 0) status = "leave";
          else if (seedValue % 9 === 0) status = "absent";
          else if (seedValue % 7 === 0) status = "late";

          return {
            studentId: student._id,
            status,
            remarks: status === "absent" ? "Demo absent entry" : status === "late" ? "Arrived after first bell" : "",
          };
        });

        await Attendance.create({
          instituteId: institute._id,
          academicGroupId: subject.academicGroupId,
          subjectId: subject._id,
          date,
          startTime,
          endTime,
          attendanceCount,
          markedBy: teacherMap[subjectSeed.teacherKey]._id,
          records,
          status: "submitted",
          createdBy: teacherMap[subjectSeed.teacherKey]._id,
          updatedBy: teacherMap[subjectSeed.teacherKey]._id,
        });
      }
    }

    const notifications = [
      { userId: adminPrimary._id, role: "admin", title: "Demo dashboards ready", message: "All seeded institute modules are populated for walkthrough.", type: "system", link: "/admin/dashboard", isRead: false, priority: "high" },
      { userId: adminOperations._id, role: "admin", title: "Pending fee follow-ups", message: "18 fee records need collection follow-up this week.", type: "fees", link: "/admin/fees", isRead: true, priority: "normal" },
      { userId: teacherMap.teacher1._id, role: "teacher", title: "Attendance trend alert", message: "Class 9A math attendance dipped below target for two students.", type: "attendance", link: "/teacher/attendance/history", isRead: false, priority: "high" },
      { userId: teacherMap.teacher6._id, role: "teacher", title: "Assignment reviews pending", message: "Three computer applications submissions are awaiting review.", type: "assignment", link: "/teacher/assignments", isRead: true, priority: "normal" },
      { userId: students[0]._id, role: "student", title: "New assignment posted", message: "Your Physics Lab task is due later this week.", type: "assignment", link: "/student/assignments", isRead: false, priority: "normal" },
      { userId: students[0]._id, role: "student", title: "Attendance advisory", message: "Your practical attendance needs improvement this month.", type: "attendance", link: "/student/attendance", isRead: true, priority: "high" },
      { userId: parents[0]._id, role: "parent", title: "Outpass approval required", message: "A hostel outpass request is waiting for your approval.", type: "hostel", link: "/parent/children", isRead: false, priority: "urgent" },
      { userId: parents[1]._id, role: "parent", title: "Fee installment received", message: "A partial payment receipt has been recorded for your child.", type: "fees", link: "/parent/fees", isRead: true, priority: "normal" },
      { userId: staffMap.staff1._id, role: "staff", title: "Overdue returns", message: "Two library books are overdue and need follow-up.", type: "library", link: "/staff/library", isRead: false, priority: "high" },
      { userId: staffMap.staff5._id, role: "staff", title: "Complaint assigned", message: "A hostel maintenance complaint has been assigned to you.", type: "hostel", link: "/staff/hostel-complaints", isRead: false, priority: "high" },
    ];

    await Notification.insertMany(
      notifications.map((item) => ({
        instituteId: institute._id,
        recipientUserId: item.userId,
        recipientRole: item.role,
        title: item.title,
        message: item.message,
        type: item.type,
        link: item.link,
        isRead: item.isRead,
        readAt: item.isRead ? new Date() : null,
        priority: item.priority,
        createdBy: adminPrimary._id,
      }))
    );

    console.log("Demo seed completed successfully.");
    console.log("Institute: Eduvanta Demo Senior Secondary School");
    console.log("Users created: 1 super admin, 2 admins, 8 teachers, 40 students, 20 parents, 8 staff");
    console.log("Modules populated: academics, attendance, fees, notices, assignments, exams, marks, hostel, transport, library, notifications, timetable");
    process.exit(0);
  } catch (error) {
    console.error(`Demo seeding failed: ${error.stack || error.message}`);
    process.exit(1);
  }
};

seedDemoData();
