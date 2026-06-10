import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";

const normalizeString = (value, { lowercase = false } = {}) => {
  const normalized = String(value || "").trim();
  return lowercase ? normalized.toLowerCase() : normalized;
};

const ensureUniqueUserFields = async ({
  email,
  phone,
  employeeId,
  staffId,
  excludeUserId = null,
}) => {
  const models = [Student, Teacher, Parent, StaffMember, Admin, SuperAdmin];

  const checks = [
    {
      value: normalizeString(email, { lowercase: true }),
      field: "email",
      message: "User with this email already exists",
    },
    {
      value: normalizeString(phone),
      field: "phone",
      message: "User with this phone number already exists",
    },
    {
      value: normalizeString(employeeId),
      field: "employeeId",
      message: "User with this employee ID already exists",
      onlyModels: [Teacher],
    },
    {
      value: normalizeString(staffId),
      field: "staffId",
      message: "User with this staff ID already exists",
      onlyModels: [StaffMember],
    },
  ];

  for (const check of checks) {
    if (!check.value) {
      continue;
    }

    const targetModels = check.onlyModels || models;
    const query = { [check.field]: check.value, isDeleted: false };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const results = await Promise.all(
      targetModels.map((M) => M.findOne(query).select("_id"))
    );

    if (results.some((r) => r)) {
      throw new Error(check.message);
    }
  }
};

const ensureUniqueStudentFields = async ({
  rollNumber,
  admissionNumber,
  registrationNumber,
  excludeStudentId = null,
}) => {
  const checks = [
    {
      value: normalizeString(rollNumber),
      query: (value) => ({ rollNumber: value, isDeleted: false }),
      message: "Student with this roll number already exists",
    },
    {
      value: normalizeString(admissionNumber),
      query: (value) => ({ admissionNumber: value, isDeleted: false }),
      message: "Student with this admission number already exists",
    },
    {
      value: normalizeString(registrationNumber),
      query: (value) => ({ registrationNumber: value, isDeleted: false }),
      message: "Student with this registration number already exists",
    },
  ];

  for (const check of checks) {
    if (!check.value) {
      continue;
    }

    const query = check.query(check.value);
    if (excludeStudentId) {
      query._id = { $ne: excludeStudentId };
    }

    const existingStudent = await Student.findOne(query).select("_id");
    if (existingStudent) {
      throw new Error(check.message);
    }
  }
};

export { ensureUniqueStudentFields, ensureUniqueUserFields, normalizeString };
