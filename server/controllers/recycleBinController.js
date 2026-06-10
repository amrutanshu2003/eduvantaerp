import AuditLog from "../models/AuditLog.js";
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

import { ensureUniqueStudentFields, ensureUniqueUserFields } from "../utils/uniqueFields.js";
import {
  RECYCLE_BIN_RETENTION_DAYS,
  getRecycleBinExpiryForRecord,
  hardDeleteStudentRecord,
  hardDeleteUserRecord,
  GENERIC_RECYCLE_BIN_MODELS,
} from "../utils/recycleBin.js";

const getRequestInstituteId = (req) => req.user.instituteId?._id || req.user.instituteId || null;

const canAccessInstitute = (req, instituteId) => {
  if (req.user.role === "superadmin") {
    return true;
  }

  return String(getRequestInstituteId(req) || "") === String(instituteId || "");
};

const getAllowedRoles = (req) =>
  req.user.role === "superadmin"
    ? ["admin", "teacher", "student", "parent", "staff"]
    : ["teacher", "student", "parent", "staff"];

const createRecycleBinItem = ({ entityType, role, id, name, email = "", phone = "", institute = null, deletedAt, expiresAt, meta = {} }) => ({
  id,
  entityType,
  role,
  name,
  email,
  phone,
  institute,
  deletedAt,
  recycleBinExpiresAt: expiresAt,
  daysRemaining: Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
  meta,
});

const roleModelMap = {
  teacher: Teacher,
  parent: Parent,
  staff: StaffMember,
  admin: Admin,
  superadmin: SuperAdmin,
};

const ENTITY_CONFIG = {
  subject: {
    model: Subject,
    searchFields: ["subjectName", "subjectCode"],
    populate: [
      { path: "academicGroupId", select: "className section" },
      { path: "teacherId", select: "name" },
    ],
    getName: (item) => item.subjectName,
    getEmail: (item) => `Code: ${item.subjectCode} | Type: ${item.subjectType}`,
    getPhone: (item) => item.academicGroupId ? `Group: ${item.academicGroupId.className}${item.academicGroupId.section ? " - " + item.academicGroupId.section : ""}` : "",
    getMeta: (item) => ({
      teacher: item.teacherId?.name || "Not assigned",
    }),
  },
  attendance: {
    model: Attendance,
    searchFields: [],
    populate: [
      { path: "academicGroupId", select: "className section" },
      { path: "subjectId", select: "subjectName" },
    ],
    getName: (item) => `Attendance - ${item.date ? new Date(item.date).toLocaleDateString("en-IN") : "-"}`,
    getEmail: (item) => item.subjectId ? `Subject: ${item.subjectId.subjectName}` : "General Attendance",
    getPhone: (item) => item.academicGroupId ? `Group: ${item.academicGroupId.className}${item.academicGroupId.section ? " - " + item.academicGroupId.section : ""}` : "",
    getMeta: (item) => ({
      markedRecords: item.records?.length || 0,
    }),
  },
  fee: {
    model: Fee,
    searchFields: ["title", "feeType"],
    populate: [
      { path: "studentId", select: "name email" },
    ],
    getName: (item) => item.title,
    getEmail: (item) => `Student: ${item.studentId?.name || "Unknown"} | Type: ${item.feeType}`,
    getPhone: (item) => `Amount: ₹${item.amount}`,
    getMeta: (item) => ({
      status: item.status,
      dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "",
    }),
  },
  notice: {
    model: Notice,
    searchFields: ["title", "description"],
    populate: [],
    getName: (item) => item.title,
    getEmail: (item) => `Audience: ${item.audience} | Type: ${item.noticeType}`,
    getPhone: (item) => `Priority: ${item.priority}`,
    getMeta: (item) => ({
      publishDate: item.publishDate ? new Date(item.publishDate).toLocaleDateString("en-IN") : "",
    }),
  },
  academicGroup: {
    model: AcademicGroup,
    searchFields: ["className", "department", "course", "section"],
    populate: [],
    getName: (item) => item.className || item.course || "Academic Group",
    getEmail: (item) => `Section: ${item.section || "-"} | Department: ${item.department || "-"}`,
    getPhone: (item) => item.semester ? `Semester: ${item.semester}` : "",
    getMeta: (item) => ({
      year: item.year || "",
      batch: item.batch || "",
    }),
  },
  exam: {
    model: Exam,
    searchFields: ["examName", "examType"],
    populate: [
      { path: "academicGroupId", select: "className section" },
    ],
    getName: (item) => item.examName,
    getEmail: (item) => `Group: ${item.academicGroupId ? `${item.academicGroupId.className} ${item.academicGroupId.section || ""}` : "-"}`,
    getPhone: (item) => `Term: ${item.term || "-"}`,
    getMeta: (item) => ({
      startDate: item.startDate ? new Date(item.startDate).toLocaleDateString("en-IN") : "",
    }),
  },
  timetable: {
    model: Timetable,
    searchFields: ["dayOfWeek"],
    populate: [
      { path: "academicGroupId", select: "className section" },
    ],
    getName: (item) => `Timetable for ${item.academicGroupId ? `${item.academicGroupId.className} ${item.academicGroupId.section || ""}` : "Academic Group"}`,
    getEmail: (item) => `Day: ${item.dayOfWeek || "-"}`,
    getPhone: (item) => `Time: ${item.startTime || "-"} - ${item.endTime || "-"}`,
    getMeta: (item) => ({}),
  },
  libraryBook: {
    model: LibraryBook,
    searchFields: ["title", "author", "isbn"],
    populate: [],
    getName: (item) => item.title,
    getEmail: (item) => `Author: ${item.author} | ISBN: ${item.isbn}`,
    getPhone: (item) => `Publisher: ${item.publisher || "-"}`,
    getMeta: (item) => ({
      quantity: item.quantity || 0,
    }),
  },
  transportRoute: {
    model: TransportRoute,
    searchFields: ["routeName", "startLocation", "endLocation"],
    populate: [],
    getName: (item) => item.routeName,
    getEmail: (item) => `Start: ${item.startLocation} | End: ${item.endLocation}`,
    getPhone: (item) => `Fare: ₹${item.routeFare}`,
    getMeta: (item) => ({}),
  },
  transportVehicle: {
    model: TransportVehicle,
    searchFields: ["vehicleNumber", "vehicleModel", "driverName"],
    populate: [],
    getName: (item) => item.vehicleNumber,
    getEmail: (item) => `Model: ${item.vehicleModel} | Capacity: ${item.seatingCapacity}`,
    getPhone: (item) => `Driver: ${item.driverName || "-"} (${item.driverPhone || "-"})`,
    getMeta: (item) => ({}),
  },
  hostel: {
    model: Hostel,
    searchFields: ["hostelName", "hostelType"],
    populate: [],
    getName: (item) => item.hostelName,
    getEmail: (item) => `Type: ${item.hostelType} | Address: ${item.address}`,
    getPhone: (item) => `Warden: ${item.wardenName || "-"}`,
    getMeta: (item) => ({}),
  },
  hostelRoom: {
    model: HostelRoom,
    searchFields: ["roomNumber", "roomType"],
    populate: [
      { path: "hostelId", select: "hostelName" },
    ],
    getName: (item) => `Room ${item.roomNumber}`,
    getEmail: (item) => `Hostel: ${item.hostelId?.hostelName || "-"}`,
    getPhone: (item) => `Type: ${item.roomType} | Rent: ₹${item.rentPerBed}`,
    getMeta: (item) => ({}),
  },
  hostelBed: {
    model: HostelBed,
    searchFields: ["bedNumber"],
    populate: [
      { path: "hostelRoomId", select: "roomNumber", populate: { path: "hostelId", select: "hostelName" } },
    ],
    getName: (item) => `Bed ${item.bedNumber}`,
    getEmail: (item) => `Room: ${item.hostelRoomId ? item.hostelRoomId.roomNumber : "-"}`,
    getPhone: (item) => `Hostel: ${item.hostelRoomId?.hostelId?.hostelName || "-"}`,
    getMeta: (item) => ({
      status: item.isOccupied ? "Occupied" : "Available",
    }),
  },
  institute: {
    model: Institute,
    searchFields: ["name", "instituteCode", "email"],
    populate: [],
    getName: (item) => item.name,
    getEmail: (item) => `Code: ${item.instituteCode} | Email: ${item.email}`,
    getPhone: (item) => `Type: ${item.instituteType} | Phone: ${item.phone || "-"}`,
    getMeta: (item) => ({
      plan: item.plan,
      paymentStatus: item.paymentStatus,
    }),
  },
};

const listRecycleBinItems = async (req, res, next) => {
  try {
    const { role = "all", search = "", instituteId = "all" } = req.query;
    const allowedRoles = getAllowedRoles(req);

    const isGenericRole = Object.keys(ENTITY_CONFIG).includes(role);

    if (role !== "all" && !allowedRoles.includes(role) && !isGenericRole) {
      res.status(400);
      throw new Error("Invalid recycle bin role filter");
    }

    const normalizedSearch = search.trim();
    const requestedInstituteId =
      req.user.role === "superadmin" && instituteId !== "all" ? instituteId : getRequestInstituteId(req);

    // If a generic role was selected, query only that model
    if (isGenericRole) {
      const config = ENTITY_CONFIG[role];
      const Model = config.model;
      const query = { isDeleted: true };

      if (requestedInstituteId && role !== "institute") {
        query.instituteId = requestedInstituteId;
      }
      if (normalizedSearch && config.searchFields.length > 0) {
        query.$or = config.searchFields.map((field) => ({
          [field]: { $regex: normalizedSearch, $options: "i" },
        }));
      }

      let q = Model.find(query);
      if (config.populate && config.populate.length > 0) {
        q = q.populate(config.populate);
      }
      const records = await q.sort({ deletedAt: -1 });

      const items = records.map((item) =>
        createRecycleBinItem({
          entityType: role,
          role: role,
          id: item._id,
          name: config.getName(item),
          email: config.getEmail(item),
          phone: config.getPhone(item),
          institute: item.instituteId
            ? {
                _id: item.instituteId._id || item.instituteId,
                name: item.instituteId.name || "",
                instituteCode: item.instituteId.instituteCode || "",
              }
            : null,
          deletedAt: item.deletedAt,
          expiresAt: getRecycleBinExpiryForRecord(item),
          meta: config.getMeta(item),
        })
      );

      return res.json({
        retentionDays: RECYCLE_BIN_RETENTION_DAYS,
        items,
      });
    }

    // For User-related role or 'all' role
    const userRoles = (role === "all" ? allowedRoles : [role]).filter((item) => item !== "student");
    const shouldIncludeStudents = role === "all" || role === "student";

    const studentQuery = {
      isDeleted: true,
    };

    if (requestedInstituteId) {
      studentQuery.instituteId = requestedInstituteId;
    }

    if (normalizedSearch) {
      studentQuery.$or = [
        { name: { $regex: normalizedSearch, $options: "i" } },
        { email: { $regex: normalizedSearch, $options: "i" } },
        { phone: { $regex: normalizedSearch, $options: "i" } },
        { rollNumber: { $regex: normalizedSearch, $options: "i" } },
        { admissionNumber: { $regex: normalizedSearch, $options: "i" } },
        { registrationNumber: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    // Query non-student role collections
    const userQueries = userRoles.map(async (r) => {
      const Model = roleModelMap[r];
      if (!Model) return [];
      const query = { isDeleted: true };
      if (requestedInstituteId && r !== "superadmin") {
        query.instituteId = requestedInstituteId;
      }
      if (normalizedSearch) {
        query.$or = [
          { name: { $regex: normalizedSearch, $options: "i" } },
          { email: { $regex: normalizedSearch, $options: "i" } },
          { phone: { $regex: normalizedSearch, $options: "i" } },
        ];
        if (r === "teacher") {
          query.$or.push({ employeeId: { $regex: normalizedSearch, $options: "i" } });
        } else if (r === "staff") {
          query.$or.push({ staffId: { $regex: normalizedSearch, $options: "i" } });
        }
      }
      return Model.find(query)
        .populate("instituteId", "name instituteCode")
        .sort({ deletedAt: -1 });
    });

    const [userResults, students] = await Promise.all([
      Promise.all(userQueries),
      shouldIncludeStudents
        ? Student.find(studentQuery)
            .populate("instituteId", "name instituteCode")
            .sort({ deletedAt: -1 })
        : [],
    ]);

    const users = userResults.flat();

    // Format Users and Students
    const userItems = users.map((user) =>
      createRecycleBinItem({
        entityType: "user",
        role: user.role,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        institute: user.instituteId
          ? {
              _id: user.instituteId._id,
              name: user.instituteId.name,
              instituteCode: user.instituteId.instituteCode,
            }
          : null,
        deletedAt: user.deletedAt,
        expiresAt: getRecycleBinExpiryForRecord(user),
        meta: {
          employeeId: user.employeeId || "",
          staffId: user.staffId || "",
        },
      })
    );

    const studentItems = students.map((student) =>
      createRecycleBinItem({
        entityType: "student",
        role: "student",
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        institute: student.instituteId
          ? {
              _id: student.instituteId._id,
              name: student.instituteId.name,
              instituteCode: student.instituteId.instituteCode,
            }
          : null,
        deletedAt: student.deletedAt,
        expiresAt: getRecycleBinExpiryForRecord(student),
        meta: {
          rollNumber: student.rollNumber,
          admissionNumber: student.admissionNumber,
          registrationNumber: student.registrationNumber || "",
        },
      })
    );

    let items = [...userItems, ...studentItems];

    // If 'all' role is selected, also merge soft-deleted records of generic entities
    if (role === "all") {
      const genericPromises = Object.entries(ENTITY_CONFIG).map(async ([key, config]) => {
        const Model = config.model;
        const query = { isDeleted: true };
        if (key === "institute" && req.user.role !== "superadmin") {
          return [];
        }
        if (requestedInstituteId && key !== "institute") {
          query.instituteId = requestedInstituteId;
        }
        if (normalizedSearch && config.searchFields.length > 0) {
          query.$or = config.searchFields.map((field) => ({
            [field]: { $regex: normalizedSearch, $options: "i" },
          }));
        }

        let q = Model.find(query);
        if (config.populate && config.populate.length > 0) {
          q = q.populate(config.populate);
        }
        const records = await q.sort({ deletedAt: -1 });

        return records.map((item) =>
          createRecycleBinItem({
            entityType: key,
            role: key,
            id: item._id,
            name: config.getName(item),
            email: config.getEmail(item),
            phone: config.getPhone(item),
            institute: item.instituteId
              ? {
                  _id: item.instituteId._id || item.instituteId,
                  name: item.instituteId.name || "",
                  instituteCode: item.instituteId.instituteCode || "",
                }
              : null,
            deletedAt: item.deletedAt,
            expiresAt: getRecycleBinExpiryForRecord(item),
            meta: config.getMeta(item),
          })
        );
      });

      const genericResults = await Promise.all(genericPromises);
      items = [...items, ...genericResults.flat()];
    }

    items.sort((left, right) => new Date(right.deletedAt).getTime() - new Date(left.deletedAt).getTime());

    res.json({
      retentionDays: RECYCLE_BIN_RETENTION_DAYS,
      items,
    });
  } catch (error) {
    next(error);
  }
};

const restoreRecycleBinItem = async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    if (entityType === "student") {
      const student = await Student.findOne({ _id: id, isDeleted: true });
      if (!student) {
        res.status(404);
        throw new Error("Deleted student not found");
      }

      if (!canAccessInstitute(req, student.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      await ensureUniqueStudentFields({
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        registrationNumber: student.registrationNumber,
        excludeStudentId: student._id,
      });

      student.isDeleted = false;
      student.deletedAt = null;
      student.recycleBinExpiresAt = null;
      student.status = "active";
      await student.save();

      await AuditLog.create({
        instituteId: student.instituteId,
        userId: req.user._id,
        action: "restore",
        module: "recycle_bin",
        targetId: student._id,
        targetType: "Student",
        metadata: { role: "student" },
        ipAddress: req.ip,
      });

      return res.json({ message: "Student restored from recycle bin successfully" });
    }

    if (entityType === "user") {
      const models = [Teacher, Parent, StaffMember, Admin, SuperAdmin];
      let user = null;
      for (const M of models) {
        user = await M.findOne({ _id: id, isDeleted: true });
        if (user) {
          break;
        }
      }

      if (!user) {
        res.status(404);
        throw new Error("Deleted user not found");
      }

      if (!getAllowedRoles(req).includes(user.role)) {
        res.status(403);
        throw new Error("You cannot restore this role");
      }

      if (!canAccessInstitute(req, user.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      await ensureUniqueUserFields({
        email: user.email,
        phone: user.phone,
        employeeId: user.employeeId,
        staffId: user.staffId,
        excludeUserId: user._id,
      });

      user.isDeleted = false;
      user.deletedAt = null;
      user.recycleBinExpiresAt = null;
      user.status = "active";
      await user.save();

      await AuditLog.create({
        instituteId: user.instituteId,
        userId: req.user._id,
        action: "restore",
        module: "recycle_bin",
        targetId: user._id,
        targetType: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        metadata: { role: user.role },
        ipAddress: req.ip,
      });

      return res.json({ message: "User restored from recycle bin successfully" });
    }

    // Generic model restoration
    const config = ENTITY_CONFIG[entityType];
    if (!config) {
      res.status(400);
      throw new Error("Invalid recycle bin entity type");
    }

    const Model = config.model;
    const record = await Model.findOne({ _id: id, isDeleted: true });
    if (!record) {
      res.status(404);
      throw new Error(`Deleted ${entityType} not found`);
    }

    if (entityType !== "institute" && !canAccessInstitute(req, record.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this recycle bin record");
    }

    // Check specific uniqueness constraints if any
    if (entityType === "subject") {
      const duplicate = await Subject.findOne({
        instituteId: record.instituteId,
        subjectCode: record.subjectCode,
        isDeleted: false,
      });
      if (duplicate) {
        res.status(400);
        throw new Error("A subject with this subject code already exists in this institute.");
      }
    }

    record.isDeleted = false;
    record.deletedAt = null;
    if (record.status !== undefined && entityType !== "attendance") {
      record.status = "active";
    }

    await record.save();

    await AuditLog.create({
      instituteId: entityType === "institute" ? record._id : record.instituteId,
      userId: req.user._id,
      action: "restore",
      module: "recycle_bin",
      targetId: record._id,
      targetType: Model.modelName,
      metadata: { entityType },
      ipAddress: req.ip,
    });

    res.json({ message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} restored from recycle bin successfully` });
  } catch (error) {
    next(error);
  }
};

const permanentlyDeleteRecycleBinItem = async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    if (entityType === "student") {
      const student = await Student.findOne({ _id: id, isDeleted: true });
      if (!student) {
        res.status(404);
        throw new Error("Deleted student not found");
      }

      if (!canAccessInstitute(req, student.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      await hardDeleteStudentRecord(student);

      await AuditLog.create({
        instituteId: student.instituteId,
        userId: req.user._id,
        action: "permanent_delete",
        module: "recycle_bin",
        targetId: student._id,
        targetType: "Student",
        metadata: { role: "student" },
        ipAddress: req.ip,
      });

      return res.json({ message: "Student permanently deleted from recycle bin" });
    }

    if (entityType === "user") {
      const models = [Teacher, Parent, StaffMember, Admin, SuperAdmin];
      let user = null;
      for (const M of models) {
        user = await M.findOne({ _id: id, isDeleted: true });
        if (user) {
          break;
        }
      }

      if (!user) {
        res.status(404);
        throw new Error("Deleted user not found");
      }

      if (!getAllowedRoles(req).includes(user.role)) {
        res.status(403);
        throw new Error("You cannot permanently delete this role");
      }

      if (!canAccessInstitute(req, user.instituteId)) {
        res.status(403);
        throw new Error("Access denied for this recycle bin record");
      }

      await hardDeleteUserRecord(user);

      await AuditLog.create({
        instituteId: user.instituteId,
        userId: req.user._id,
        action: "permanent_delete",
        module: "recycle_bin",
        targetId: user._id,
        targetType: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        metadata: { role: user.role },
        ipAddress: req.ip,
      });

      return res.json({ message: "User permanently deleted from recycle bin" });
    }

    // Generic model permanent delete
    const config = ENTITY_CONFIG[entityType];
    if (!config) {
      res.status(400);
      throw new Error("Invalid recycle bin entity type");
    }

    const Model = config.model;
    const record = await Model.findOne({ _id: id, isDeleted: true });
    if (!record) {
      res.status(404);
      throw new Error(`Deleted ${entityType} not found`);
    }

    if (entityType !== "institute" && !canAccessInstitute(req, record.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this recycle bin record");
    }

    await Model.deleteOne({ _id: id });

    await AuditLog.create({
      instituteId: entityType === "institute" ? record._id : record.instituteId,
      userId: req.user._id,
      action: "permanent_delete",
      module: "recycle_bin",
      targetId: record._id,
      targetType: Model.modelName,
      metadata: { entityType },
      ipAddress: req.ip,
    });

    res.json({ message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} permanently deleted from recycle bin` });
  } catch (error) {
    next(error);
  }
};

const emptyRecycleBin = async (req, res, next) => {
  try {
    const { instituteId = "all" } = req.query;
    const requestedInstituteId =
      req.user.role === "superadmin" && instituteId !== "all" ? instituteId : getRequestInstituteId(req);

    // 1. Student
    const studentQuery = { isDeleted: true };
    if (requestedInstituteId) {
      studentQuery.instituteId = requestedInstituteId;
    }
    const studentsToDelete = await Student.find(studentQuery);
    for (const student of studentsToDelete) {
      await hardDeleteStudentRecord(student);
    }

    // 2. Users (Teacher, Parent, StaffMember, Admin, SuperAdmin)
    const allowedRoles = getAllowedRoles(req);
    for (const role of allowedRoles) {
      const Model = roleModelMap[role];
      if (!Model) continue;
      const userQuery = { isDeleted: true };
      if (requestedInstituteId && role !== "superadmin") {
        userQuery.instituteId = requestedInstituteId;
      }
      const usersToDelete = await Model.find(userQuery);
      for (const user of usersToDelete) {
        await hardDeleteUserRecord(user);
      }
    }

    // 3. Generic Recycle Bin Models
    for (const Model of GENERIC_RECYCLE_BIN_MODELS) {
      const query = { isDeleted: true };
      if (Model.modelName === "Institute" && req.user.role !== "superadmin") {
        continue;
      }
      if (requestedInstituteId && Model.modelName !== "Institute") {
        query.instituteId = requestedInstituteId;
      }
      await Model.deleteMany(query);
    }

    // Create Audit Log
    await AuditLog.create({
      instituteId: requestedInstituteId || null,
      userId: req.user._id,
      action: "empty_recycle_bin",
      module: "recycle_bin",
      metadata: { requestedInstituteId },
      ipAddress: req.ip,
    });

    res.json({ message: "Recycle bin emptied successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  listRecycleBinItems,
  restoreRecycleBinItem,
  permanentlyDeleteRecycleBinItem,
  emptyRecycleBin,
};
