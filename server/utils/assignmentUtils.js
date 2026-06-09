const sanitizeAssignment = (assignment) => ({
  _id: assignment._id,
  instituteId: assignment.instituteId,
  academicGroupId: assignment.academicGroupId,
  subjectId: assignment.subjectId,
  teacherId: assignment.teacherId,
  title: assignment.title,
  description: assignment.description,
  dueDate: assignment.dueDate,
  maxMarks: assignment.maxMarks,
  attachment: assignment.attachment,
  assignmentType: assignment.assignmentType,
  status: assignment.status,
  createdBy: assignment.createdBy,
  updatedBy: assignment.updatedBy,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
});

const sanitizeAssignmentSubmission = (submission) => ({
  _id: submission._id,
  instituteId: submission.instituteId,
  assignmentId: submission.assignmentId,
  studentId: submission.studentId,
  answerText: submission.answerText,
  attachment: submission.attachment,
  submittedAt: submission.submittedAt,
  status: submission.status,
  marksObtained: submission.marksObtained,
  feedback: submission.feedback,
  reviewedBy: submission.reviewedBy,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
});

export { sanitizeAssignment, sanitizeAssignmentSubmission };
