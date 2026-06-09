const assignmentTypeOptions = ["homework", "assignment", "project", "lab_work", "research_task"];
const assignmentStatusOptions = ["draft", "published", "closed"];

const assignmentFormDefaults = {
  academicGroupId: "",
  subjectId: "",
  title: "",
  description: "",
  dueDate: "",
  maxMarks: "",
  attachment: "",
  assignmentType: "assignment",
  status: "draft",
};

const assignmentSubmissionDefaults = {
  answerText: "",
  attachment: "",
};

export { assignmentTypeOptions, assignmentStatusOptions, assignmentFormDefaults, assignmentSubmissionDefaults };
