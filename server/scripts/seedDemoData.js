import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Institute from "../models/Institute.js";
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import AcademicGroup from "../models/AcademicGroup.js";
import Subject from "../models/Subject.js";
import Notice from "../models/Notice.js";
import Fee from "../models/Fee.js";
import Timetable from "../models/Timetable.js";
import LibraryBook from "../models/LibraryBook.js";
import TransportRoute from "../models/TransportRoute.js";
import TransportVehicle from "../models/TransportVehicle.js";
import Hostel from "../models/Hostel.js";
import HostelRoom from "../models/HostelRoom.js";
import HostelBed from "../models/HostelBed.js";
import ERPSettings from "../models/ERPSettings.js";
import LabelSettings from "../models/LabelSettings.js";
import ModuleSettings from "../models/ModuleSettings.js";
import AcademicSettings from "../models/AcademicSettings.js";
import FormSettings from "../models/FormSettings.js";
import UISettings from "../models/UISettings.js";

dotenv.config();

const defaultERPSettings = {
  appName: "Eduvanta ERP",
  appShortName: "Eduvanta",
  tagline: "Complete Institution Management System",
  logo: "",
  favicon: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  accentColor: "#3b82f6",
  sidebarColor: "#0f172a",
  navbarColor: "#ffffff",
  backgroundColor: "#f8fafc",
  cardColor: "#ffffff",
  textColor: "#1e293b",
  buttonStyle: "rounded",
  themeMode: "system",
  loginLayout: "split",
  loginBackground: "",
  loginHeroTitle: "Welcome Back",
  loginHeroSubtitle: "Sign in to access your dashboard",
  footerText: "© 2026 Eduvanta ERP. All rights reserved.",
  enableDarkMode: true,
  enableCaptcha: false,
  enableRememberMe: true,
  enableForgotPassword: true,
  defaultLanguage: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  currency: "USD",
  timezone: "UTC",
};

const defaultLabelSettings = {
  labels: {
    instituteLabel: "Institute",
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
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

const defaultFormSettings = {
  entity: "student",
  fields: [],
};

const defaultUISettings = {
  appName: "Eduvanta ERP",
  primaryColor: "#0f766e",
  sidebarColor: "#0f172a",
  buttonStyle: "rounded",
};

const seedDemoData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for demo seeding...");

    // 1. Find all old institutes with target codes and clear them to prevent unique collisions
    const targetCodes = ["SPS", "EDC", "EDU", "GWIS", "APEX"];
    const oldInstitutes = await Institute.find({
      instituteCode: { $in: targetCodes },
    });

    const oldInstituteIds = oldInstitutes.map((inst) => inst._id);
    console.log(`Clearing old records for codes: ${targetCodes.join(", ")}`);

    if (oldInstituteIds.length > 0) {
      await Promise.all([
        Institute.deleteMany({ _id: { $in: oldInstituteIds } }),
        Admin.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Teacher.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Student.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Parent.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        StaffMember.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        AcademicGroup.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Subject.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Notice.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Fee.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Timetable.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        LibraryBook.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        TransportRoute.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        TransportVehicle.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        Hostel.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelRoom.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        HostelBed.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        ERPSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        LabelSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        ModuleSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        AcademicSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        FormSettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
        UISettings.deleteMany({ instituteId: { $in: oldInstituteIds } }),
      ]);
    }

    // Clear by specific email suffixes or list to prevent index clashes
    await Promise.all([
      Admin.deleteMany({ email: { $regex: /@eduvanta\.com$/ } }),
      Teacher.deleteMany({ email: { $regex: /@eduvanta\.com$/ } }),
      Student.deleteMany({ email: { $regex: /@eduvanta\.edu$/ } }),
      Parent.deleteMany({ email: { $regex: /@eduvanta\.com$/ } }),
      StaffMember.deleteMany({ email: { $regex: /@eduvanta\.com$/ } }),
    ]);

    // 2. Create the 3 institutes
    console.log("Seeding institutes...");
    const schoolInst = await Institute.create({
      name: "Sunrise Public School",
      instituteCode: "SPS",
      instituteType: "school",
      email: "info@sunrise.edu",
      phone: "9876540001",
      address: "123 Sector 4, Sunrise Hills",
      headName: "Principal Mary Jane",
      plan: "free",
      paymentStatus: "trial",
      status: "active",
    });

    const collegeInst = await Institute.create({
      name: "Eduvanta Degree College",
      instituteCode: "EDC",
      instituteType: "college",
      email: "info@eduvantacollege.edu",
      phone: "9876540002",
      address: "456 Tech Zone, Education City",
      headName: "Dean Richard Feynman",
      plan: "free",
      paymentStatus: "trial",
      status: "active",
    });

    const universityInst = await Institute.create({
      name: "Eduvanta University",
      instituteCode: "EDU",
      instituteType: "university",
      email: "info@eduvantauniversity.edu",
      phone: "9876540003",
      address: "789 Knowledge Boulevard, University Square",
      headName: "Chancellor Albert Einstein",
      plan: "free",
      paymentStatus: "trial",
      status: "active",
    });

    const institutes = [schoolInst, collegeInst, universityInst];

    // 3. Initialize settings for each
    console.log("Initializing settings for all institutes...");
    for (const inst of institutes) {
      await Promise.all([
        ERPSettings.create({ ...defaultERPSettings, instituteId: inst._id }),
        LabelSettings.create({ ...defaultLabelSettings, instituteId: inst._id }),
        ModuleSettings.create({ ...defaultModuleSettings, instituteId: inst._id }),
        FormSettings.create({ ...defaultFormSettings, instituteId: inst._id, entity: "student" }),
        UISettings.create({ ...defaultUISettings, instituteId: inst._id }),
      ]);
    }

    await AcademicSettings.create({
      instituteId: schoolInst._id,
      academicGroupLabel: "Class",
      subGroupLabel: "Section",
      teacherLabel: "Teacher",
      parentLabel: "Parent",
      studentLabel: "Student",
      levels: [
        { name: "Pre-Primary", order: 1, status: "active" },
        { name: "Primary", order: 2, status: "active" },
        { name: "Middle", order: 3, status: "active" },
        { name: "Secondary", order: 4, status: "active" },
      ],
      fields: [],
    });

    await AcademicSettings.create({
      instituteId: collegeInst._id,
      academicGroupLabel: "Year/Semester",
      subGroupLabel: "Section",
      teacherLabel: "Professor",
      parentLabel: "Guardian",
      studentLabel: "Student",
      levels: [
        { name: "UG", order: 1, status: "active" },
        { name: "PG", order: 2, status: "active" },
        { name: "Diploma", order: 3, status: "active" },
      ],
      fields: [],
    });

    await AcademicSettings.create({
      instituteId: universityInst._id,
      academicGroupLabel: "Department/Semester",
      subGroupLabel: "Section",
      teacherLabel: "Lecturer",
      parentLabel: "Guardian",
      studentLabel: "Student",
      levels: [
        { name: "UG", order: 1, status: "active" },
        { name: "PG", order: 2, status: "active" },
        { name: "PhD", order: 3, status: "active" },
      ],
      fields: [],
    });

    // 4. Create Admins
    console.log("Seeding admins...");
    const schoolAdmin = await Admin.create({
      name: "SPS School Admin",
      email: "spsadmin@eduvanta.com",
      password: "Admin@123",
      phone: "9111111111",
      role: "admin",
      permissions: ["*"],
      status: "active",
      instituteId: schoolInst._id,
    });

    const collegeAdmin = await Admin.create({
      name: "EDC College Admin",
      email: "edcadmin@eduvanta.com",
      password: "Admin@123",
      phone: "9222222222",
      role: "admin",
      permissions: ["*"],
      status: "active",
      instituteId: collegeInst._id,
    });

    const universityAdmin = await Admin.create({
      name: "EDU University Admin",
      email: "eduadmin@eduvanta.com",
      password: "Admin@123",
      phone: "9333333333",
      role: "admin",
      permissions: ["*"],
      status: "active",
      instituteId: universityInst._id,
    });

    // 5. Create Academic Groups
    console.log("Seeding academic groups...");
    const schoolGroup = await AcademicGroup.create({
      instituteId: schoolInst._id,
      instituteType: "school",
      schoolLevel: "Secondary",
      className: "Class 10",
      section: "A",
      status: "active",
      createdBy: schoolAdmin._id,
    });

    const collegeGroup = await AcademicGroup.create({
      instituteId: collegeInst._id,
      instituteType: "college",
      programLevel: "UG",
      department: "Computer Science",
      course: "B.Tech",
      semester: "Semester 1",
      section: "A",
      status: "active",
      createdBy: collegeAdmin._id,
    });

    const universityGroup = await AcademicGroup.create({
      instituteId: universityInst._id,
      instituteType: "university",
      programLevel: "PG",
      department: "Physics",
      course: "M.Sc",
      semester: "Semester 1",
      section: "A",
      status: "active",
      createdBy: universityAdmin._id,
    });

    // 6. Create 5 Teachers total
    console.log("Seeding 5 teachers...");
    const spsTeacher1 = await Teacher.create({
      name: "Alice MathTeacher",
      email: "spsteacher1@eduvanta.com",
      password: "Teacher@123",
      phone: "9444444441",
      employeeId: "T-SPS-001",
      qualification: "M.Sc B.Ed",
      experience: "5 years",
      department: "Mathematics",
      assignedAcademicGroups: [schoolGroup._id],
      status: "active",
      instituteId: schoolInst._id,
    });

    const spsTeacher2 = await Teacher.create({
      name: "Bob EnglishTeacher",
      email: "spsteacher2@eduvanta.com",
      password: "Teacher@123",
      phone: "9444444442",
      employeeId: "T-SPS-002",
      qualification: "M.A B.Ed",
      experience: "8 years",
      department: "English",
      assignedAcademicGroups: [schoolGroup._id],
      status: "active",
      instituteId: schoolInst._id,
    });

    const edcTeacher1 = await Teacher.create({
      name: "Dr. Charlie Professor",
      email: "edcteacher1@eduvanta.com",
      password: "Teacher@123",
      phone: "9444444443",
      employeeId: "T-EDC-001",
      qualification: "PhD Computer Science",
      experience: "12 years",
      department: "CSE",
      assignedAcademicGroups: [collegeGroup._id],
      status: "active",
      instituteId: collegeInst._id,
    });

    const edcTeacher2 = await Teacher.create({
      name: "Dr. David OSProfessor",
      email: "edcteacher2@eduvanta.com",
      password: "Teacher@123",
      phone: "9444444444",
      employeeId: "T-EDC-002",
      qualification: "PhD Information Tech",
      experience: "10 years",
      department: "IT",
      assignedAcademicGroups: [collegeGroup._id],
      status: "active",
      instituteId: collegeInst._id,
    });

    const eduTeacher1 = await Teacher.create({
      name: "Dr. Emma Physicist",
      email: "eduteacher1@eduvanta.com",
      password: "Teacher@123",
      phone: "9444444445",
      employeeId: "T-EDU-001",
      qualification: "PhD Quantum Physics",
      experience: "15 years",
      department: "Physics",
      assignedAcademicGroups: [universityGroup._id],
      status: "active",
      instituteId: universityInst._id,
    });

    schoolGroup.mentorOrClassTeacher = spsTeacher1._id;
    await schoolGroup.save();
    collegeGroup.mentorOrClassTeacher = edcTeacher1._id;
    await collegeGroup.save();
    universityGroup.mentorOrClassTeacher = eduTeacher1._id;
    await universityGroup.save();

    // 7. Create 10 Parents total
    console.log("Seeding 10 parents...");
    const spsParents = [];
    for (let i = 1; i <= 4; i++) {
      const parent = await Parent.create({
        name: `SPS Parent ${i}`,
        email: `spsparent${i}@eduvanta.com`,
        password: "Parent@123",
        phone: `955555550${i}`,
        relation: "father",
        address: `SPS Campus Road ${i}`,
        status: "active",
        instituteId: schoolInst._id,
      });
      spsParents.push(parent);
    }

    const edcParents = [];
    for (let i = 1; i <= 3; i++) {
      const parent = await Parent.create({
        name: `EDC Parent ${i}`,
        email: `edcparent${i}@eduvanta.com`,
        password: "Parent@123",
        phone: `955555551${i}`,
        relation: "mother",
        address: `EDC Housing Complex ${i}`,
        status: "active",
        instituteId: collegeInst._id,
      });
      edcParents.push(parent);
    }

    const eduParents = [];
    for (let i = 1; i <= 3; i++) {
      const parent = await Parent.create({
        name: `EDU Parent ${i}`,
        email: `eduparent${i}@eduvanta.com`,
        password: "Parent@123",
        phone: `955555552${i}`,
        relation: "father",
        address: `EDU Avenue Suite ${i}`,
        status: "active",
        instituteId: universityInst._id,
      });
      eduParents.push(parent);
    }

    // 8. Create 20 Students total (8 SPS, 6 EDC, 6 EDU)
    console.log("Seeding 20 students...");
    const schoolStudents = [];
    for (let i = 1; i <= 8; i++) {
      const parentIndex = Math.floor((i - 1) / 2); // 2 students per parent
      const parent = spsParents[parentIndex];
      const student = await Student.create({
        name: `SPS Student ${i}`,
        email: `spsstud${i}@eduvanta.edu`,
        password: "Student@123",
        phone: `966666600${i}`,
        rollNumber: `SPS100${i}`,
        admissionNumber: `ADM-SPS-2026-0${i}`,
        academicGroupId: schoolGroup._id,
        admissionDate: new Date(),
        status: "active",
        instituteId: schoolInst._id,
        parentIds: [parent._id],
      });
      parent.linkedStudentIds.push(student._id);
      await parent.save();
      schoolStudents.push(student);
    }

    const collegeStudents = [];
    for (let i = 1; i <= 6; i++) {
      const parentIndex = Math.floor((i - 1) / 2);
      const parent = edcParents[parentIndex];
      const student = await Student.create({
        name: `EDC Student ${i}`,
        email: `edcstud${i}@eduvanta.edu`,
        password: "Student@123",
        phone: `966666610${i}`,
        rollNumber: `EDC100${i}`,
        admissionNumber: `ADM-EDC-2026-0${i}`,
        academicGroupId: collegeGroup._id,
        admissionDate: new Date(),
        status: "active",
        instituteId: collegeInst._id,
        parentIds: [parent._id],
      });
      parent.linkedStudentIds.push(student._id);
      await parent.save();
      collegeStudents.push(student);
    }

    const universityStudents = [];
    for (let i = 1; i <= 6; i++) {
      const parentIndex = Math.floor((i - 1) / 2);
      const parent = eduParents[parentIndex];
      const student = await Student.create({
        name: `EDU Student ${i}`,
        email: `edustud${i}@eduvanta.edu`,
        password: "Student@123",
        phone: `966666620${i}`,
        rollNumber: `EDU100${i}`,
        admissionNumber: `ADM-EDU-2026-0${i}`,
        academicGroupId: universityGroup._id,
        admissionDate: new Date(),
        status: "active",
        instituteId: universityInst._id,
        parentIds: [parent._id],
      });
      parent.linkedStudentIds.push(student._id);
      await parent.save();
      universityStudents.push(student);
    }

    // 9. Create 5 Staff Members total
    console.log("Seeding 5 staff members...");
    const spsStaff1 = await StaffMember.create({
      name: "SPS Librarian Lily",
      email: "spslibrarian@eduvanta.com",
      password: "Staff@123",
      phone: "9777777001",
      staffId: "S-SPS-001",
      designation: "librarian",
      permissions: ["library.manage"],
      status: "active",
      instituteId: schoolInst._id,
    });

    const spsStaff2 = await StaffMember.create({
      name: "SPS Driver Danny",
      email: "spsdriver@eduvanta.com",
      password: "Staff@123",
      phone: "9777777002",
      staffId: "S-SPS-002",
      designation: "driver",
      permissions: ["transport.view"],
      status: "active",
      instituteId: schoolInst._id,
    });

    const edcStaff1 = await StaffMember.create({
      name: "EDC Warden Wendy",
      email: "edcwarden@eduvanta.com",
      password: "Staff@123",
      phone: "9777777003",
      staffId: "S-EDC-001",
      designation: "hostel_warden",
      permissions: ["hostel.manage"],
      status: "active",
      instituteId: collegeInst._id,
    });

    const edcStaff2 = await StaffMember.create({
      name: "EDC Guard Sam",
      email: "edcguard@eduvanta.com",
      password: "Staff@123",
      phone: "9777777004",
      staffId: "S-EDC-002",
      designation: "security_guard",
      permissions: [],
      status: "active",
      instituteId: collegeInst._id,
    });

    const eduStaff1 = await StaffMember.create({
      name: "EDU Clerk Cathy",
      email: "educlerk@eduvanta.com",
      password: "Staff@123",
      phone: "9777777005",
      staffId: "S-EDU-001",
      designation: "receptionist",
      permissions: ["student.view"],
      status: "active",
      instituteId: universityInst._id,
    });

    // 10. Create 5 Subjects total (2 SPS, 2 EDC, 1 EDU)
    console.log("Seeding 5 subjects...");
    const spsSub1 = await Subject.create({
      instituteId: schoolInst._id,
      academicGroupId: schoolGroup._id,
      subjectName: "Mathematics",
      subjectCode: "MATH101",
      subjectType: "core",
      teacherId: spsTeacher1._id,
      totalMarks: 100,
      passingMarks: 33,
      createdBy: schoolAdmin._id,
    });

    const spsSub2 = await Subject.create({
      instituteId: schoolInst._id,
      academicGroupId: schoolGroup._id,
      subjectName: "English Literature",
      subjectCode: "ENGL101",
      subjectType: "core",
      teacherId: spsTeacher2._id,
      totalMarks: 100,
      passingMarks: 33,
      createdBy: schoolAdmin._id,
    });

    const edcSub1 = await Subject.create({
      instituteId: collegeInst._id,
      academicGroupId: collegeGroup._id,
      subjectName: "Data Structures & Algorithms",
      subjectCode: "CS201",
      subjectType: "core",
      teacherId: edcTeacher1._id,
      totalMarks: 100,
      passingMarks: 40,
      createdBy: collegeAdmin._id,
    });

    const edcSub2 = await Subject.create({
      instituteId: collegeInst._id,
      academicGroupId: collegeGroup._id,
      subjectName: "Operating Systems",
      subjectCode: "CS202",
      subjectType: "core",
      teacherId: edcTeacher2._id,
      totalMarks: 100,
      passingMarks: 40,
      createdBy: collegeAdmin._id,
    });

    const eduSub1 = await Subject.create({
      instituteId: universityInst._id,
      academicGroupId: universityGroup._id,
      subjectName: "Quantum Mechanics",
      subjectCode: "PHY501",
      subjectType: "core",
      teacherId: eduTeacher1._id,
      totalMarks: 100,
      passingMarks: 50,
      createdBy: universityAdmin._id,
    });

    // 11. Create 5 Notices total
    console.log("Seeding 5 notices...");
    await Notice.create({
      instituteId: schoolInst._id,
      title: "SPS Annual Sports Day",
      description: "Sunrise Public School Annual Sports Day will be held next Friday at the main playground.",
      noticeType: "general",
      audience: "all",
      priority: "normal",
      publishDate: new Date(),
      status: "published",
      createdBy: schoolAdmin._id,
      createdByModel: "Admin",
    });

    await Notice.create({
      instituteId: schoolInst._id,
      title: "SPS Q1 Exams Schedule",
      description: "Q1 exams schedule has been uploaded to the portal for Class 10.",
      noticeType: "academic",
      audience: "students",
      priority: "high",
      publishDate: new Date(),
      status: "published",
      createdBy: schoolAdmin._id,
      createdByModel: "Admin",
    });

    await Notice.create({
      instituteId: collegeInst._id,
      title: "EDC Hackathon 2026",
      description: "Register for the Eduvanta Degree College annual hackathon before tomorrow evening.",
      noticeType: "event",
      audience: "students",
      priority: "normal",
      publishDate: new Date(),
      status: "published",
      createdBy: collegeAdmin._id,
      createdByModel: "Admin",
    });

    await Notice.create({
      instituteId: collegeInst._id,
      title: "EDC Semester Syllabus Update",
      description: "The B.Tech Semester 1 CSE syllabus has been updated. Please consult your advisor.",
      noticeType: "academic",
      audience: "students",
      priority: "normal",
      publishDate: new Date(),
      status: "published",
      createdBy: collegeAdmin._id,
      createdByModel: "Admin",
    });

    await Notice.create({
      instituteId: universityInst._id,
      title: "EDU Research Grant Approvals",
      description: "Eduvanta University Physics Department research project grants have been approved. Contact head of department.",
      noticeType: "general",
      audience: "teachers",
      priority: "high",
      publishDate: new Date(),
      status: "published",
      createdBy: universityAdmin._id,
      createdByModel: "Admin",
    });

    // 12. Create 5 Fees total
    console.log("Seeding 5 fees...");
    await Fee.create({
      instituteId: schoolInst._id,
      studentId: schoolStudents[0]._id,
      academicGroupId: schoolGroup._id,
      feeType: "tuition",
      title: "Tuition Fee Q1",
      description: "Sunrise Public School Q1 Tuition Fee.",
      amount: 1200,
      discount: 100,
      fine: 0,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "unpaid",
      createdBy: schoolAdmin._id,
    });

    await Fee.create({
      instituteId: schoolInst._id,
      studentId: schoolStudents[1]._id,
      academicGroupId: schoolGroup._id,
      feeType: "admission",
      title: "Admission Registration Fee",
      description: "Sunrise Public School Registration Fee.",
      amount: 500,
      discount: 0,
      fine: 0,
      paidAmount: 500,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(),
      paymentMethod: "cash",
      transactionId: "TXN-SPS-001",
      status: "paid",
      createdBy: schoolAdmin._id,
    });

    await Fee.create({
      instituteId: collegeInst._id,
      studentId: collegeStudents[0]._id,
      academicGroupId: collegeGroup._id,
      feeType: "tuition",
      title: "B.Tech Semester 1 Tuition Fee",
      description: "Eduvanta Degree College semester tuition fee.",
      amount: 3000,
      discount: 0,
      fine: 50,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: "unpaid",
      createdBy: collegeAdmin._id,
    });

    await Fee.create({
      instituteId: collegeInst._id,
      studentId: collegeStudents[1]._id,
      academicGroupId: collegeGroup._id,
      feeType: "library",
      title: "Semester 1 Library Subscription Fee",
      description: "Access fees for library card and books.",
      amount: 250,
      discount: 0,
      fine: 0,
      paidAmount: 250,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(),
      paymentMethod: "upi",
      transactionId: "TXN-EDC-002",
      status: "paid",
      createdBy: collegeAdmin._id,
    });

    await Fee.create({
      instituteId: universityInst._id,
      studentId: universityStudents[0]._id,
      academicGroupId: universityGroup._id,
      feeType: "exam",
      title: "M.Sc Sem 1 Final Exam Fees",
      description: "Eduvanta University Semester 1 Physics Final Exam Fee.",
      amount: 800,
      discount: 0,
      fine: 0,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: "unpaid",
      createdBy: universityAdmin._id,
    });

    // 13. Create 3 Timetable Records total (1 per institute)
    console.log("Seeding 3 timetable records...");
    await Timetable.create({
      instituteId: schoolInst._id,
      academicGroupId: schoolGroup._id,
      dayOfWeek: "monday",
      periods: [
        {
          periodNumber: 1,
          subjectId: spsSub1._id,
          teacherId: spsTeacher1._id,
          startTime: "09:00",
          endTime: "09:45",
          roomNumber: "Classroom 10A",
          type: "theory",
        },
        {
          periodNumber: 2,
          subjectId: spsSub2._id,
          teacherId: spsTeacher2._id,
          startTime: "09:45",
          endTime: "10:30",
          roomNumber: "Classroom 10A",
          type: "theory",
        },
      ],
      createdBy: schoolAdmin._id,
    });

    await Timetable.create({
      instituteId: collegeInst._id,
      academicGroupId: collegeGroup._id,
      dayOfWeek: "monday",
      periods: [
        {
          periodNumber: 1,
          subjectId: edcSub1._id,
          teacherId: edcTeacher1._id,
          startTime: "10:00",
          endTime: "11:00",
          roomNumber: "Lab 3",
          type: "practical",
        },
        {
          periodNumber: 2,
          subjectId: edcSub2._id,
          teacherId: edcTeacher2._id,
          startTime: "11:00",
          endTime: "12:00",
          roomNumber: "Room 304",
          type: "theory",
        },
      ],
      createdBy: collegeAdmin._id,
    });

    await Timetable.create({
      instituteId: universityInst._id,
      academicGroupId: universityGroup._id,
      dayOfWeek: "monday",
      periods: [
        {
          periodNumber: 1,
          subjectId: eduSub1._id,
          teacherId: eduTeacher1._id,
          startTime: "11:30",
          endTime: "13:00",
          roomNumber: "Physics Hall B",
          type: "theory",
        },
      ],
      createdBy: universityAdmin._id,
    });

    // 14. Create 3 Library Books total
    console.log("Seeding 3 library books...");
    await LibraryBook.create({
      instituteId: schoolInst._id,
      title: "High School Physics",
      author: "H.C. Verma",
      isbn: "9788177091809",
      category: "textbook",
      subjectId: spsSub1._id,
      academicGroupId: schoolGroup._id,
      publisher: "Bharti Bhawan",
      edition: "2024",
      language: "English",
      shelfNumber: "A-4",
      totalCopies: 10,
      availableCopies: 10,
      createdBy: schoolAdmin._id,
    });

    await LibraryBook.create({
      instituteId: collegeInst._id,
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      isbn: "9780262033848",
      category: "reference",
      subjectId: edcSub1._id,
      academicGroupId: collegeGroup._id,
      publisher: "MIT Press",
      edition: "3rd",
      language: "English",
      shelfNumber: "CS-02",
      totalCopies: 5,
      availableCopies: 5,
      createdBy: collegeAdmin._id,
    });

    await LibraryBook.create({
      instituteId: universityInst._id,
      title: "Principles of Quantum Mechanics",
      author: "R. Shankar",
      isbn: "9780306447907",
      category: "research",
      subjectId: eduSub1._id,
      academicGroupId: universityGroup._id,
      publisher: "Plenum Press",
      edition: "2nd",
      language: "English",
      shelfNumber: "PHY-D-10",
      totalCopies: 3,
      availableCopies: 3,
      createdBy: universityAdmin._id,
    });

    // 15. Create 2 Transport Routes
    console.log("Seeding transport routes...");
    const schoolBus = await TransportVehicle.create({
      instituteId: schoolInst._id,
      vehicleNumber: "KA-01-F-1234",
      vehicleType: "bus",
      capacity: 40,
      driverId: spsStaff2._id,
      status: "active",
      createdBy: schoolAdmin._id,
    });

    await TransportRoute.create({
      instituteId: schoolInst._id,
      routeName: "Route A - North Sunrise City",
      routeCode: "SPS-ROUTE-A",
      vehicleId: schoolBus._id,
      driverId: spsStaff2._id,
      startPoint: "North Gate Terminal",
      endPoint: "Sunrise School Campus",
      stops: [
        { stopName: "Main Chowk Stop", pickupTime: "07:30 AM", dropTime: "02:30 PM", stopOrder: 1 },
        { stopName: "Metro Plaza Stop", pickupTime: "07:50 AM", dropTime: "02:10 PM", stopOrder: 2 },
      ],
      monthlyFee: 150,
      createdBy: schoolAdmin._id,
    });

    await TransportRoute.create({
      instituteId: collegeInst._id,
      routeName: "Route B - South Campus Express",
      routeCode: "EDC-ROUTE-B",
      startPoint: "South City Bus Depot",
      endPoint: "Degree College Campus",
      stops: [
        { stopName: "Green Avenue Corner", pickupTime: "08:15 AM", dropTime: "04:45 PM", stopOrder: 1 },
      ],
      monthlyFee: 200,
      createdBy: collegeAdmin._id,
    });

    // 16. Create 1 Hostel with Rooms & Beds in College EDC
    console.log("Seeding hostel, rooms and beds...");
    const collegeHostel = await Hostel.create({
      instituteId: collegeInst._id,
      hostelName: "EDC Boys Hostel Block A",
      hostelCode: "EDC-BHA",
      hostelType: "boys",
      totalFloors: 3,
      address: "EDC Campus East Wing",
      wardenId: edcStaff1._id,
      contactNumber: "9000000001",
      createdBy: collegeAdmin._id,
    });

    const hostelRoom101 = await HostelRoom.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomNumber: "Room 101",
      floorNumber: 1,
      roomType: "double",
      capacity: 2,
      occupiedBeds: 1,
      status: "available",
      createdBy: collegeAdmin._id,
    });

    const hostelRoom102 = await HostelRoom.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomNumber: "Room 102",
      floorNumber: 1,
      roomType: "double",
      capacity: 2,
      occupiedBeds: 0,
      status: "available",
      createdBy: collegeAdmin._id,
    });

    // Seed beds
    await HostelBed.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomId: hostelRoom101._id,
      bedNumber: "Bed 101-A",
      status: "occupied",
      allocatedStudentId: collegeStudents[0]._id,
      createdBy: collegeAdmin._id,
    });

    await HostelBed.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomId: hostelRoom101._id,
      bedNumber: "Bed 101-B",
      status: "available",
      createdBy: collegeAdmin._id,
    });

    await HostelBed.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomId: hostelRoom102._id,
      bedNumber: "Bed 102-A",
      status: "available",
      createdBy: collegeAdmin._id,
    });

    await HostelBed.create({
      instituteId: collegeInst._id,
      hostelId: collegeHostel._id,
      roomId: hostelRoom102._id,
      bedNumber: "Bed 102-B",
      status: "available",
      createdBy: collegeAdmin._id,
    });

    console.log("Demo data seeding completed successfully! ✅");
    process.exit(0);
  } catch (error) {
    console.error(`Demo seeding failed: ${error.stack || error.message}`);
    process.exit(1);
  }
};

seedDemoData();
