const ROLE_TO_MODEL = {
  superadmin: "SuperAdmin",
  admin: "Admin",
  teacher: "Teacher",
  staff: "StaffMember",
  student: "Student",
  parent: "Parent",
};

const getUserModelName = (role, fallback = "Admin") => ROLE_TO_MODEL[role] || fallback;

export { getUserModelName };
