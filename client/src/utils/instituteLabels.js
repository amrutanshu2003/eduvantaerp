const getInstituteType = (user) => user?.institute?.instituteType || "school";

const getTeacherLabel = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Faculty" : "Teacher");
const getTeacherLabelPlural = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Faculty" : "Teachers");
const getParentLabel = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Guardian" : "Parent");
const getParentLabelPlural = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Guardians" : "Parents");
const getAcademicGroupLabel = (user) =>
  ["college", "university"].includes(getInstituteType(user)) ? "Academic Groups" : "Classes";
const getSubjectLabel = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Subject / Paper" : "Subject");
const getSubjectLabelPlural = (user) => (["college", "university"].includes(getInstituteType(user)) ? "Subjects / Papers" : "Subjects");

export {
  getInstituteType,
  getTeacherLabel,
  getTeacherLabelPlural,
  getParentLabel,
  getParentLabelPlural,
  getAcademicGroupLabel,
  getSubjectLabel,
  getSubjectLabelPlural,
};
