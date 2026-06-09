import AcademicGroup from "../models/AcademicGroup.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import createAuditLog from "../utils/audit.js";
import { serializeUser } from "../utils/serializers.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";

const sanitizeStudent = (student) => ({
  _id: student._id,
  userId: student.userId,
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

    const existingUser = await User.findOne({ email: email.trim().toLowerCase(), isDeleted: false });
    if (existingUser) {
      res.status(409);
      throw new Error("User with this email already exists");
    }

    if (academicGroupId) {
      const group = await AcademicGroup.findOne({ _id: academicGroupId, instituteId, isDeleted: false });
      if (!group) {
        res.status(400);
        throw new Error("Academic group not found for this institute");
      }
    }

    const studentUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      password: password.trim(),
      role: "student",
      instituteId,
      status,
      createdBy: req.user._id,
    });

    const student = await Student.create({
      userId: studentUser._id,
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
      user: serializeUser(studentUser),
    });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const students = await Student.find(buildStudentQuery(req))
      .populate("userId", "-password")
      .populate("academicGroupId", "className section department course semester year batch")
      .sort({ createdAt: -1 });

    const filteredStudents = students.filter((student) => {
      const search = req.query.search?.trim().toLowerCase();
      if (!search) {
        return true;
      }

      return (
        student.userId?.name?.toLowerCase().includes(search) ||
        student.rollNumber?.toLowerCase().includes(search) ||
        student.admissionNumber?.toLowerCase().includes(search)
      );
    });

    res.json({
      students: filteredStudents.map((student) => ({
        ...sanitizeStudent(student),
        user: student.userId ? serializeUser(student.userId) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false })
      .populate("userId", "-password")
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
        user: student.userId ? serializeUser(student.userId) : null,
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

    const user = await User.findById(student.userId).select("+password");
    if (!user || user.isDeleted) {
      res.status(404);
      throw new Error("Student user not found");
    }

    if (req.body.email && req.body.email.trim().toLowerCase() !== user.email) {
      const duplicateUser = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
        isDeleted: false,
        _id: { $ne: user._id },
      });
      if (duplicateUser) {
        res.status(409);
        throw new Error("User with this email already exists");
      }
    }

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

    Object.assign(user, {
      name: req.body.name?.trim() ?? user.name,
      email: req.body.email?.trim().toLowerCase() ?? user.email,
      phone: req.body.phone?.trim() ?? user.phone,
      status: req.body.status ?? user.status,
    });

    if (req.body.password?.trim()) {
      user.password = req.body.password.trim();
    }

    await user.save();

    Object.assign(student, {
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
      user: serializeUser(user),
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

    await User.findByIdAndUpdate(student.userId, { status });

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
    student.status = "inactive";
    await student.save();

    await User.findByIdAndUpdate(student.userId, {
      isDeleted: true,
      deletedAt: new Date(),
      status: "inactive",
    });

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
    const student = await Student.findOne({ userId: req.user._id, isDeleted: false })
      .populate("userId", "-password")
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
        user: student.userId ? serializeUser(student.userId) : null,
        academicGroup: student.academicGroupId,
        parents: student.parentIds,
        institute: student.instituteId,
      },
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
};
