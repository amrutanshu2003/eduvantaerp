const defaultForm = {
  instituteId: "",
  instituteType: "",
  schoolLevel: "",
  className: "",
  programLevel: "",
  department: "",
  course: "",
  semester: "",
  year: "",
  batch: "",
  section: "",
  status: "active",
};

const trimValue = (value) => (typeof value === "string" ? value.trim() : value);

const resetStructureFields = (current = {}, nextInstituteType = "") => ({
  ...current,
  instituteType: nextInstituteType,
  schoolLevel: "",
  className: "",
  programLevel: "",
  department: "",
  course: "",
  semester: "",
  year: "",
  batch: "",
  section: "",
});

const buildAcademicGroupPayload = (formData = {}, instituteType = "") => {
  const payload = {
    instituteId: trimValue(formData.instituteId),
    instituteType,
    status: trimValue(formData.status) || "active",
  };

  if (instituteType === "school") {
    payload.schoolLevel = trimValue(formData.schoolLevel);
    payload.className = trimValue(formData.className);
    payload.section = trimValue(formData.section);
    return payload;
  }

  if (instituteType === "college" || instituteType === "university") {
    payload.programLevel = trimValue(formData.programLevel);
    payload.department = trimValue(formData.department);
    payload.course = trimValue(formData.course);
    payload.section = trimValue(formData.section);

    ["semester", "year", "batch"].forEach((key) => {
      const value = trimValue(formData[key]);
      if (value) {
        payload[key] = value;
      }
    });
  }

  return payload;
};

const validateAcademicGroupForm = ({ formData = {}, instituteType = "", requiresInstitute = false }) => {
  const fieldErrors = {};

  if (requiresInstitute && !trimValue(formData.instituteId)) {
    fieldErrors.instituteId = "Institute is required.";
  }

  if (!instituteType) {
    if (!fieldErrors.instituteId) {
      fieldErrors.instituteId = "Select an institute to continue.";
    }
    return fieldErrors;
  }

  if (instituteType === "school") {
    if (!trimValue(formData.schoolLevel)) fieldErrors.schoolLevel = "School Level is required.";
    if (!trimValue(formData.className)) fieldErrors.className = "Class Name is required.";
    if (!trimValue(formData.section)) fieldErrors.section = "Section is required.";
  }

  if (instituteType === "college" || instituteType === "university") {
    if (!trimValue(formData.programLevel)) fieldErrors.programLevel = "Program Level is required.";
    if (!trimValue(formData.department)) fieldErrors.department = "Department is required.";
    if (!trimValue(formData.course)) fieldErrors.course = "Course is required.";
    if (!trimValue(formData.section)) fieldErrors.section = "Section is required.";
  }

  return fieldErrors;
};

export { buildAcademicGroupPayload, defaultForm, resetStructureFields, validateAcademicGroupForm };
