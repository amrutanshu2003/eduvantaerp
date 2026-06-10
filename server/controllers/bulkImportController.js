import AcademicGroup from "../models/AcademicGroup.js";
import Institute from "../models/Institute.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import Subject from "../models/Subject.js";
import createAuditLog from "../utils/audit.js";
import {
  buildAcademicGroupLookupKey,
  coerceDate,
  coerceNumber,
  coerceStatus,
  getTrimmedValue,
  parseCsv,
  splitPipeValues,
} from "../utils/bulkImportUtils.js";
import { getScopedInstituteId } from "../utils/scope.js";
import { ensureUniqueStudentFields, ensureUniqueUserFields } from "../utils/uniqueFields.js";

const supportedEntityTypes = [
  "academic_groups",
  "teachers",
  "students",
  "parents",
  "staff",
  "subjects",
];

const getInstituteForRequest = async (req) => {
  const instituteId = getScopedInstituteId(req, true);
  if (!instituteId) {
    throw new Error("Institute scope not found for this request");
  }

  const institute = await Institute.findById(instituteId);
  if (!institute || institute.isDeleted) {
    throw new Error("Institute not found");
  }

  return institute;
};

const createContext = async (req) => {
  const institute = await getInstituteForRequest(req);
  const instituteId = institute._id;

  const [teachers, parents, staff, admins, groups, students, subjects] = await Promise.all([
    Teacher.find({ instituteId, isDeleted: false }).select("name email phone role employeeId"),
    Parent.find({ instituteId, isDeleted: false }).select("name email phone role"),
    StaffMember.find({ instituteId, isDeleted: false }).select("name email phone role staffId"),
    Admin.find({ instituteId, isDeleted: false }).select("name email phone role"),
    AcademicGroup.find({ instituteId, isDeleted: false }).select(
      "instituteType schoolLevel className programLevel department course semester year batch section"
    ),
    Student.find({ instituteId, isDeleted: false }).select("admissionNumber rollNumber registrationNumber academicGroupId name email phone"),
    Subject.find({ instituteId, isDeleted: false }).select("subjectCode"),
  ]);

  const users = [...teachers, ...parents, ...staff, ...admins, ...students];

  const usersByEmail = new Map();
  const usersByPhone = new Map();
  const usersByEmployeeId = new Map();
  const usersByStaffId = new Map();
  users.forEach((user) => usersByEmail.set(String(user.email).toLowerCase(), user));
  users.forEach((user) => {
    if (user.phone) {
      usersByPhone.set(String(user.phone), user);
    }
    if (user.employeeId) {
      usersByEmployeeId.set(String(user.employeeId), user);
    }
    if (user.staffId) {
      usersByStaffId.set(String(user.staffId), user);
    }
  });

  const groupsByKey = new Map();
  groups.forEach((group) => {
    groupsByKey.set(buildAcademicGroupLookupKey(group, group.instituteType), group);
  });

  const studentsByAdmissionNumber = new Map();
  const studentsByRollNumber = new Map();
  const studentsByRegistrationNumber = new Map();
  students.forEach((student) => {
    if (student.admissionNumber) {
      studentsByAdmissionNumber.set(String(student.admissionNumber).toLowerCase(), student);
    }
    if (student.rollNumber) {
      studentsByRollNumber.set(String(student.rollNumber).toLowerCase(), student);
    }
    if (student.registrationNumber) {
      studentsByRegistrationNumber.set(String(student.registrationNumber).toLowerCase(), student);
    }
  });

  const subjectCodes = new Set(subjects.map((subject) => String(subject.subjectCode || "").toUpperCase()));

  return {
    institute,
    instituteId,
    usersByEmail,
    usersByPhone,
    usersByEmployeeId,
    usersByStaffId,
    groupsByKey,
    studentsByAdmissionNumber,
    studentsByRollNumber,
    studentsByRegistrationNumber,
    subjectCodes,
  };
};

const resolveAcademicGroup = (row, context) => {
  const academicGroupId = getTrimmedValue(row, "academic_group_id");
  if (academicGroupId) {
    return academicGroupId;
  }

  const lookupKey = buildAcademicGroupLookupKey(
    {
      schoolLevel: getTrimmedValue(row, "school_level"),
      className: getTrimmedValue(row, "class_name"),
      programLevel: getTrimmedValue(row, "program_level"),
      department: getTrimmedValue(row, "department"),
      course: getTrimmedValue(row, "course"),
      semester: getTrimmedValue(row, "semester"),
      year: getTrimmedValue(row, "year"),
      batch: getTrimmedValue(row, "batch"),
      section: getTrimmedValue(row, "section"),
    },
    context.institute.instituteType
  );

  const group = context.groupsByKey.get(lookupKey);
  if (!group) {
    throw new Error("Academic group not found. Fill academic_group_id or the correct group columns");
  }

  return group._id;
};

const resolveTeacherByEmail = (email, context, fieldLabel = "Teacher") => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const teacher = context.usersByEmail.get(normalizedEmail);
  if (!teacher || teacher.role !== "teacher") {
    throw new Error(`${fieldLabel} email not found in this institute`);
  }

  return teacher._id;
};

const importAcademicGroupRow = async (row, context, req) => {
  const payload = {
    instituteId: context.instituteId,
    instituteType: context.institute.instituteType,
    schoolLevel: getTrimmedValue(row, "school_level") || null,
    className: getTrimmedValue(row, "class_name"),
    programLevel: getTrimmedValue(row, "program_level") || null,
    department: getTrimmedValue(row, "department"),
    course: getTrimmedValue(row, "course"),
    semester: getTrimmedValue(row, "semester"),
    year: getTrimmedValue(row, "year"),
    batch: getTrimmedValue(row, "batch"),
    section: getTrimmedValue(row, "section"),
    status: coerceStatus(row.status),
    createdBy: req.user._id,
  };

  if (context.institute.instituteType === "school") {
    if (!payload.schoolLevel || !payload.className || !payload.section) {
      throw new Error("school_level, class_name, and section are required for school institute");
    }
  } else if (!payload.programLevel || !payload.department || !payload.course || !payload.section) {
    throw new Error(`program_level, department, course, and section are required for ${context.institute.instituteType} institute`);
  }

  const mentorEmail = getTrimmedValue(row, "mentor_teacher_email");
  if (mentorEmail) {
    payload.mentorOrClassTeacher = resolveTeacherByEmail(mentorEmail, context, "Mentor/Class teacher");
  }

  const lookupKey = buildAcademicGroupLookupKey(payload, context.institute.instituteType);
  if (context.groupsByKey.has(lookupKey)) {
    throw new Error("Academic group already exists");
  }

  const group = await AcademicGroup.create(payload);
  context.groupsByKey.set(lookupKey, group);

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "academic_group",
    entityId: group._id,
    message: "Academic group imported in bulk",
  });

  return { id: group._id, summary: payload.className || `${payload.department} - ${payload.course}` };
};

const importTeacherRow = async (row, context, req) => {
  const name = getTrimmedValue(row, "name");
  const email = getTrimmedValue(row, "email").toLowerCase();
  const password = getTrimmedValue(row, "password");

  if (!name || !email || !password) {
    throw new Error("name, email, and password are required");
  }

  if (context.usersByEmail.has(email)) {
    throw new Error("User with this email already exists");
  }
  const phone = getTrimmedValue(row, "phone");
  const employeeId = getTrimmedValue(row, "employee_id");
  if (phone && context.usersByPhone.has(phone)) {
    throw new Error("User with this phone number already exists");
  }
  if (employeeId && context.usersByEmployeeId.has(employeeId)) {
    throw new Error("User with this employee ID already exists");
  }
  await ensureUniqueUserFields({ email, phone, employeeId });

  const teacher = await Teacher.create({
    name,
    email,
    password,
    phone,
    role: "teacher",
    instituteId: context.instituteId,
    employeeId,
    qualification: getTrimmedValue(row, "qualification"),
    experience: getTrimmedValue(row, "experience"),
    department: getTrimmedValue(row, "department"),
    profilePhoto: getTrimmedValue(row, "profile_photo"),
    status: coerceStatus(row.status),
    createdBy: req.user._id,
    createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
  });

  context.usersByEmail.set(email, teacher);
  if (phone) {
    context.usersByPhone.set(phone, teacher);
  }
  if (employeeId) {
    context.usersByEmployeeId.set(employeeId, teacher);
  }

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "teacher",
    entityId: teacher._id,
    message: "Teacher imported in bulk",
  });

  return { id: teacher._id, summary: teacher.email };
};

const importStudentRow = async (row, context, req) => {
  const name = getTrimmedValue(row, "name");
  const email = getTrimmedValue(row, "email").toLowerCase();
  const password = getTrimmedValue(row, "password");
  const rollNumber = getTrimmedValue(row, "roll_number");
  const admissionNumber = getTrimmedValue(row, "admission_number");
  const registrationNumber = getTrimmedValue(row, "registration_number");
  const phone = getTrimmedValue(row, "phone");

  if (!name || !email || !password || !rollNumber || !admissionNumber) {
    throw new Error("name, email, password, roll_number, and admission_number are required");
  }

  if (context.usersByEmail.has(email)) {
    throw new Error("User with this email already exists");
  }
  if (phone && context.usersByPhone.has(phone)) {
    throw new Error("User with this phone number already exists");
  }
  if (context.studentsByRollNumber.has(rollNumber.toLowerCase())) {
    throw new Error("Student with this roll number already exists");
  }
  if (context.studentsByAdmissionNumber.has(admissionNumber.toLowerCase())) {
    throw new Error("Student with this admission number already exists");
  }
  if (registrationNumber && context.studentsByRegistrationNumber.has(registrationNumber.toLowerCase())) {
    throw new Error("Student with this registration number already exists");
  }
  await ensureUniqueUserFields({ email, phone });
  await ensureUniqueStudentFields({ rollNumber, admissionNumber, registrationNumber });

  const academicGroupId =
    getTrimmedValue(row, "academic_group_id") ||
    getTrimmedValue(row, "class_name") ||
    getTrimmedValue(row, "department") ||
    getTrimmedValue(row, "course") ||
    getTrimmedValue(row, "section")
      ? resolveAcademicGroup(row, context)
      : null;

  const student = await Student.create({
    name,
    email,
    phone,
    password,
    role: "student",
    instituteId: context.instituteId,
    academicGroupId,
    rollNumber,
    admissionNumber,
    registrationNumber,
    dob: coerceDate(row.dob),
    gender: getTrimmedValue(row, "gender").toLowerCase(),
    bloodGroup: getTrimmedValue(row, "blood_group"),
    address: getTrimmedValue(row, "address"),
    admissionDate: coerceDate(row.admission_date),
    status: coerceStatus(row.status),
    createdBy: req.user._id,
    createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
  });

  context.usersByEmail.set(email, student);
  if (phone) {
    context.usersByPhone.set(phone, student);
  }
  context.studentsByAdmissionNumber.set(admissionNumber.toLowerCase(), student);
  context.studentsByRollNumber.set(rollNumber.toLowerCase(), student);
  if (registrationNumber) {
    context.studentsByRegistrationNumber.set(registrationNumber.toLowerCase(), student);
  }

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "student",
    entityId: student._id,
    message: "Student imported in bulk",
  });

  return { id: student._id, summary: admissionNumber };
};

const importParentRow = async (row, context, req) => {
  const name = getTrimmedValue(row, "name");
  const email = getTrimmedValue(row, "email").toLowerCase();
  const password = getTrimmedValue(row, "password");
  const relation = getTrimmedValue(row, "relation").toLowerCase();

  if (!name || !email || !password || !relation) {
    throw new Error("name, email, password, and relation are required");
  }

  if (!["father", "mother", "guardian", "other"].includes(relation)) {
    throw new Error("relation must be father, mother, guardian, or other");
  }

  if (context.usersByEmail.has(email)) {
    throw new Error("User with this email already exists");
  }
  const phone = getTrimmedValue(row, "phone");
  if (phone && context.usersByPhone.has(phone)) {
    throw new Error("User with this phone number already exists");
  }
  await ensureUniqueUserFields({ email, phone });

  const linkedAdmissions = splitPipeValues(row.linked_student_admission_numbers);
  const linkedRollNumbers = splitPipeValues(row.linked_student_roll_numbers);
  const linkedStudentIds = [];

  linkedAdmissions.forEach((admissionNumber) => {
    const student = context.studentsByAdmissionNumber.get(admissionNumber.toLowerCase());
    if (!student) {
      throw new Error(`Linked student not found for admission number ${admissionNumber}`);
    }
    linkedStudentIds.push(student._id);
  });

  linkedRollNumbers.forEach((rollNumber) => {
    const student = context.studentsByRollNumber.get(rollNumber.toLowerCase());
    if (!student) {
      throw new Error(`Linked student not found for roll number ${rollNumber}`);
    }
    linkedStudentIds.push(student._id);
  });

  const uniqueLinkedStudentIds = [...new Set(linkedStudentIds.map((value) => String(value)))];

  const parent = await Parent.create({
    name,
    email,
    phone,
    password,
    role: "parent",
    instituteId: context.instituteId,
    relation,
    linkedStudentIds: uniqueLinkedStudentIds,
    address: getTrimmedValue(row, "address"),
    status: coerceStatus(row.status),
    createdBy: req.user._id,
    createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
  });

  context.usersByEmail.set(email, parent);
  if (phone) {
    context.usersByPhone.set(phone, parent);
  }

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "parent",
    entityId: parent._id,
    message: "Parent imported in bulk",
  });

  return { id: parent._id, summary: parent.email };
};

const importStaffRow = async (row, context, req) => {
  const name = getTrimmedValue(row, "name");
  const email = getTrimmedValue(row, "email").toLowerCase();
  const password = getTrimmedValue(row, "password");
  const staffId = getTrimmedValue(row, "staff_id");
  const designation = getTrimmedValue(row, "designation");
  const phone = getTrimmedValue(row, "phone");

  if (!name || !email || !password || !staffId || !designation) {
    throw new Error("name, email, password, staff_id, and designation are required");
  }

  if (context.usersByEmail.has(email)) {
    throw new Error("User with this email already exists");
  }
  if (phone && context.usersByPhone.has(phone)) {
    throw new Error("User with this phone number already exists");
  }
  if (context.usersByStaffId.has(staffId)) {
    throw new Error("User with this staff ID already exists");
  }
  await ensureUniqueUserFields({ email, phone, staffId });

  const staff = await StaffMember.create({
    name,
    email,
    phone,
    password,
    role: "staff",
    instituteId: context.instituteId,
    staffId,
    designation,
    department: getTrimmedValue(row, "department"),
    joiningDate: coerceDate(row.joining_date),
    salary: coerceNumber(row.salary, "salary"),
    address: getTrimmedValue(row, "address"),
    permissions: splitPipeValues(row.permissions),
    status: coerceStatus(row.status),
    createdBy: req.user._id,
    createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
  });

  context.usersByEmail.set(email, staff);
  if (phone) {
    context.usersByPhone.set(phone, staff);
  }
  context.usersByStaffId.set(staffId, staff);

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "staff",
    entityId: staff._id,
    message: "Staff imported in bulk",
  });

  return { id: staff._id, summary: staff.staffId };
};

const importSubjectRow = async (row, context, req) => {
  const subjectName = getTrimmedValue(row, "subject_name");
  const subjectCode = getTrimmedValue(row, "subject_code").toUpperCase();

  if (!subjectName || !subjectCode) {
    throw new Error("subject_name and subject_code are required");
  }

  if (context.subjectCodes.has(subjectCode)) {
    throw new Error("Subject code already exists in this institute");
  }

  const academicGroupId = resolveAcademicGroup(row, context);
  const teacherEmail = getTrimmedValue(row, "teacher_email");

  const subject = await Subject.create({
    instituteId: context.instituteId,
    academicGroupId,
    subjectName,
    subjectCode,
    subjectType: getTrimmedValue(row, "subject_type") || "core",
    teacherId: teacherEmail ? resolveTeacherByEmail(teacherEmail, context) : null,
    totalMarks: coerceNumber(row.total_marks, "total_marks") ?? 100,
    passingMarks: coerceNumber(row.passing_marks, "passing_marks") ?? 33,
    status: coerceStatus(row.status),
    createdBy: req.user._id,
    createdByModel: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
  });

  context.subjectCodes.add(subjectCode);

  await createAuditLog({
    req,
    instituteId: context.instituteId,
    action: "bulk_create",
    entity: "subject",
    entityId: subject._id,
    message: "Subject imported in bulk",
  });

  return { id: subject._id, summary: subject.subjectCode };
};

const entityImporters = {
  academic_groups: importAcademicGroupRow,
  teachers: importTeacherRow,
  students: importStudentRow,
  parents: importParentRow,
  staff: importStaffRow,
  subjects: importSubjectRow,
};

const bulkImport = async (req, res, next) => {
  try {
    const entityType = String(req.body.entityType || "").trim().toLowerCase();
    const csvText = String(req.body.csvText || "");

    if (!supportedEntityTypes.includes(entityType)) {
      res.status(400);
      throw new Error("Unsupported entity type for bulk import");
    }

    if (!csvText.trim()) {
      res.status(400);
      throw new Error("CSV data is required");
    }

    const { rows } = parseCsv(csvText);
    const context = await createContext(req);
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const row of rows) {
      try {
        const created = await entityImporters[entityType](row, context, req);
        successCount += 1;
        results.push({
          rowNumber: row.__rowNumber,
          status: "success",
          summary: created.summary,
        });
      } catch (error) {
        failureCount += 1;
        results.push({
          rowNumber: row.__rowNumber,
          status: "error",
          error: error.message,
        });
      }
    }

    res.json({
      message:
        failureCount > 0
          ? `Bulk import completed with ${successCount} success and ${failureCount} failed rows`
          : `Bulk import completed successfully with ${successCount} rows`,
      entityType,
      totalRows: rows.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    next(error);
  }
};

export { bulkImport };
