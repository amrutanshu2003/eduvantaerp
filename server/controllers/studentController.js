import AcademicGroup from "../models/AcademicGroup.js";
import Student from "../models/Student.js";
import Institute from "../models/Institute.js";
import createAuditLog from "../utils/audit.js";
import { getRecycleBinExpiryDate } from "../utils/recycleBin.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { ensureUniqueStudentFields, ensureUniqueUserFields } from "../utils/uniqueFields.js";

const sanitizeStudent = (student) => ({
  _id: student._id,
  name: student.name,
  email: student.email,
  phone: student.phone,
  role: student.role,
  instituteId: student.instituteId,
  academicGroupId: student.academicGroupId,
  rollNumber: student.rollNumber,
  admissionNumber: student.admissionNumber,
  registrationNumber: student.registrationNumber,
  dob: student.dob,
  gender: student.gender,
  bloodGroup: student.bloodGroup,
  address: student.address,
  admissionDate: student.admissionDate,
  parentIds: student.parentIds,
  status: student.status,
  profilePhoto: student.profilePhoto,
  isDeleted: student.isDeleted,
  deletedAt: student.deletedAt,
  recycleBinExpiresAt: student.recycleBinExpiresAt,
  createdBy: student.createdBy,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const buildStudentQuery = (req) => {
  const query = { isDeleted: false };
  const instituteId = getScopedInstituteId(req, true);
  if (instituteId) {
    query.instituteId = instituteId;
  }
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }
  if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
    query.academicGroupId = req.query.academicGroupId;
  }
  return query;
};

const createStudent = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const {
      name,
      email,
      phone,
      password,
      academicGroupId,
      rollNumber,
      admissionNumber,
      registrationNumber,
      dob,
      gender,
      bloodGroup,
      address,
      admissionDate,
      status = "active",
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !rollNumber?.trim() || !admissionNumber?.trim()) {
      res.status(400);
      throw new Error("Name, email, password, roll number, and admission number are required");
    }

    await ensureUniqueUserFields({
      email,
      phone,
    });
    await ensureUniqueStudentFields({
      rollNumber,
      admissionNumber,
      registrationNumber,
    });

    if (academicGroupId) {
      const group = await AcademicGroup.findOne({ _id: academicGroupId, instituteId, isDeleted: false });
      if (!group) {
        res.status(400);
        throw new Error("Academic group not found for this institute");
      }
    }

    const student = await Student.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "student",
      instituteId,
      academicGroupId: academicGroupId || null,
      rollNumber: rollNumber.trim(),
      admissionNumber: admissionNumber.trim(),
      registrationNumber: registrationNumber?.trim() || "",
      dob: dob || null,
      gender: gender || "",
      bloodGroup: bloodGroup?.trim() || "",
      address: address?.trim() || "",
      admissionDate: admissionDate || null,
      status,
      createdBy: req.user._id,
      createdByModel: req.user?.role === "superadmin" ? "SuperAdmin" : "Admin",
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "student",
      entityId: student._id,
      message: "Student created",
    });

    res.status(201).json({
      message: "Student created successfully",
      student: sanitizeStudent(student),
      user: serializeUser(student),
    });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const students = await Student.find(buildStudentQuery(req))
      .populate("academicGroupId", "className section department course semester year batch")
      .sort({ createdAt: -1 });

    const filteredStudents = students.filter((student) => {
      const search = req.query.search?.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return (
        student.name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        student.rollNumber?.toLowerCase().includes(search) ||
        student.admissionNumber?.toLowerCase().includes(search)
      );
    });

    res.json({
      students: filteredStudents.map((student) => ({
        ...sanitizeStudent(student),
        user: serializeUser(student),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false })
      .populate("academicGroupId", "className section department course semester year batch")
      .populate("parentIds", "name email phone relation");

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    res.json({
      student: {
        ...sanitizeStudent(student),
        user: serializeUser(student),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    await ensureUniqueUserFields({
      email: req.body.email ?? student.email,
      phone: req.body.phone ?? student.phone,
      excludeUserId: student._id,
    });
    await ensureUniqueStudentFields({
      rollNumber: req.body.rollNumber ?? student.rollNumber,
      admissionNumber: req.body.admissionNumber ?? student.admissionNumber,
      registrationNumber: req.body.registrationNumber ?? student.registrationNumber,
      excludeStudentId: student._id,
    });

    if (req.body.academicGroupId) {
      const group = await AcademicGroup.findOne({
        _id: req.body.academicGroupId,
        instituteId: student.instituteId,
        isDeleted: false,
      });
      if (!group) {
        res.status(400);
        throw new Error("Academic group not found for this institute");
      }
    }

    Object.assign(student, {
      name: req.body.name?.trim() ?? student.name,
      email: req.body.email?.trim().toLowerCase() ?? student.email,
      phone: req.body.phone?.trim() ?? student.phone,
      academicGroupId: req.body.academicGroupId ?? student.academicGroupId,
      rollNumber: req.body.rollNumber?.trim() ?? student.rollNumber,
      admissionNumber: req.body.admissionNumber?.trim() ?? student.admissionNumber,
      registrationNumber: req.body.registrationNumber?.trim() ?? student.registrationNumber,
      dob: req.body.dob ?? student.dob,
      gender: req.body.gender ?? student.gender,
      bloodGroup: req.body.bloodGroup?.trim() ?? student.bloodGroup,
      address: req.body.address?.trim() ?? student.address,
      admissionDate: req.body.admissionDate ?? student.admissionDate,
      status: req.body.status ?? student.status,
    });

    if (req.body.password?.trim()) {
      student.password = req.body.password.trim();
    }

    await student.save();

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "update",
      entity: "student",
      entityId: student._id,
      message: "Student updated",
    });

    res.json({
      message: "Student updated successfully",
      student: sanitizeStudent(student),
      user: serializeUser(student),
    });
  } catch (error) {
    next(error);
  }
};

const updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const student = await Student.findOne({ _id: req.params.id, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    student.status = status;
    await student.save();

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "status_update",
      entity: "student",
      entityId: student._id,
      message: `Student marked ${status}`,
    });

    res.json({ message: "Student status updated successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    student.isDeleted = true;
    student.deletedAt = new Date();
    student.recycleBinExpiresAt = getRecycleBinExpiryDate(student.deletedAt);
    student.status = "inactive";
    await student.save();

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "soft_delete",
      entity: "student",
      entityId: student._id,
      message: "Student deleted",
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const assignAcademicGroupToStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const group = await AcademicGroup.findOne({
      _id: req.body.academicGroupId,
      instituteId: student.instituteId,
      isDeleted: false,
    });

    if (!group) {
      res.status(400);
      throw new Error("Academic group not found for this institute");
    }

    student.academicGroupId = group._id;
    await student.save();

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "assign_academic_group",
      entity: "student",
      entityId: student._id,
      message: "Academic group assigned to student",
    });

    res.json({ message: "Academic group assigned successfully", student: sanitizeStudent(student) });
  } catch (error) {
    next(error);
  }
};

const getStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.user._id, isDeleted: false })
      .populate("academicGroupId", "className section department course semester year batch")
      .populate("parentIds", "name email phone relation")
      .populate("instituteId", "name instituteCode instituteType status logo banner");

    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    res.json({
      student: {
        ...sanitizeStudent(student),
        user: serializeUser(student),
        academicGroup: student.academicGroupId,
        parents: student.parentIds,
        institute: student.instituteId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getNextStudentSequences = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    if (!instituteId) {
      res.status(400);
      throw new Error("Institute ID is required");
    }

    const { academicGroupId } = req.query;

    let departmentCode = "std";
    let programLevel = "UG";

    if (academicGroupId) {
      const group = await AcademicGroup.findOne({
        _id: academicGroupId,
        instituteId,
        isDeleted: false,
      });

      if (group) {
        if (group.instituteType === "school") {
          programLevel = "SCH";
          if (group.className) {
            departmentCode = group.className
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/class/g, "c");
          }
        } else {
          if (group.programLevel) {
            programLevel = group.programLevel;
          }

          const dept = group.department?.trim();
          const crs = group.course?.trim();

          if (dept) {
            const words = dept.split(/\s+/).filter(Boolean);
            if (words.length > 1) {
              departmentCode = words.map((w) => w[0]).join("").toLowerCase();
            } else {
              departmentCode = dept.toLowerCase().slice(0, 3);
            }
          } else if (crs) {
            departmentCode = crs.toLowerCase().replace(/[^a-z0-9]/gi, "");
          }
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const shortYear = String(currentYear).slice(-2);

    // 1. Roll Number
    const rollPattern = new RegExp(`^${shortYear}${departmentCode}\\d+$`);
    const rollStudents = await Student.find({
      instituteId,
      rollNumber: { $regex: rollPattern },
    }).select("rollNumber");

    let maxRollSeq = 0;
    rollStudents.forEach((s) => {
      const seqStr = s.rollNumber.slice(shortYear.length + departmentCode.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxRollSeq) {
        maxRollSeq = seq;
      }
    });
    const nextRollNumber = `${shortYear}${departmentCode}${String(maxRollSeq + 1).padStart(3, "0")}`;

    // 2. Registration Number
    const regPrefix = `${shortYear}${programLevel}01`;
    const regPattern = new RegExp(`^${regPrefix}\\d+$`);
    const regStudents = await Student.find({
      instituteId,
      registrationNumber: { $regex: regPattern },
    }).select("registrationNumber");

    let maxRegSeq = 0;
    regStudents.forEach((s) => {
      const seqStr = s.registrationNumber.slice(regPrefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxRegSeq) {
        maxRegSeq = seq;
      }
    });
    const nextRegistrationNumber = `${regPrefix}${String(maxRegSeq + 1).padStart(4, "0")}`;

    // 3. Admission Number
    const admPrefix = `${shortYear}${programLevel}ADM`;
    const admPattern = new RegExp(`^${admPrefix}\\d+$`);
    const admStudents = await Student.find({
      instituteId,
      admissionNumber: { $regex: admPattern },
    }).select("admissionNumber");

    let maxAdmSeq = 0;
    admStudents.forEach((s) => {
      const seqStr = s.admissionNumber.slice(admPrefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxAdmSeq) {
        maxAdmSeq = seq;
      }
    });
    const nextAdmissionNumber = `${admPrefix}${String(maxAdmSeq + 1).padStart(4, "0")}`;

    const today = new Date().toISOString().slice(0, 10);

    res.json({
      rollNumber: nextRollNumber,
      registrationNumber: nextRegistrationNumber,
      admissionNumber: nextAdmissionNumber,
      admissionDate: today,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
  assignAcademicGroupToStudent,
  getStudentProfile,
  getNextStudentSequences,
};
