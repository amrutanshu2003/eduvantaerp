import Student from "../models/Student.js";
import User from "../models/User.js";

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
  const checks = [
    {
      value: normalizeString(email, { lowercase: true }),
      query: (value) => ({ email: value, isDeleted: false }),
      message: "User with this email already exists",
    },
    {
      value: normalizeString(phone),
      query: (value) => ({ phone: value, isDeleted: false }),
      message: "User with this phone number already exists",
    },
    {
      value: normalizeString(employeeId),
      query: (value) => ({ employeeId: value, isDeleted: false }),
      message: "User with this employee ID already exists",
    },
    {
      value: normalizeString(staffId),
      query: (value) => ({ staffId: value, isDeleted: false }),
      message: "User with this staff ID already exists",
    },
  ];

  for (const check of checks) {
    if (!check.value) {
      continue;
    }

    const query = check.query(check.value);
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query).select("_id");
    if (existingUser) {
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
