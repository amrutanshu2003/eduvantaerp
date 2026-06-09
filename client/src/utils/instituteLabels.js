const getInstituteType = (user) => user?.institute?.instituteType || "school";

const getTeacherLabel = (user) => (getInstituteType(user) === "college" ? "Faculty" : "Teacher");
const getTeacherLabelPlural = (user) => (getInstituteType(user) === "college" ? "Faculty" : "Teachers");
const getParentLabel = (user) => (getInstituteType(user) === "college" ? "Guardian" : "Parent");
const getParentLabelPlural = (user) => (getInstituteType(user) === "college" ? "Guardians" : "Parents");
const getAcademicGroupLabel = (user) =>
  getInstituteType(user) === "college" ? "Academic Groups" : "Classes";
const getSubjectLabel = (user) => (getInstituteType(user) === "college" ? "Subject / Paper" : "Subject");
const getSubjectLabelPlural = (user) => (getInstituteType(user) === "college" ? "Subjects / Papers" : "Subjects");

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
