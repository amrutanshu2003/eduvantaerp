import AcademicGroup from "../models/AcademicGroup.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import createAuditLog from "../utils/audit.js";
import { sanitizeAssignment, sanitizeAssignmentSubmission } from "../utils/assignmentUtils.js";
import {
  ensureParentStudentAccess,
  ensureTeacherAcademicGroupAccess,
  ensureTeacherSubjectAccess,
  getStudentProfileForUser,
} from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { createNotification, getUserIdsByRole } from "../utils/notificationUtils.js";

const populateAssignment = (query) =>
  query
    .populate("academicGroupId", "className section department course semester year batch")
    .populate("subjectId", "subjectName subjectCode teacherId academicGroupId")
    .populate("teacherId", "name email")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const populateSubmission = (query) =>
  query
    .populate("studentId")
    .populate("assignmentId", "title dueDate maxMarks status")
    .populate("reviewedBy", "name role");

const validateAssignmentPayload = async (req, payload) => {
  const instituteId = getScopedInstituteId(req, false);

  if (!payload.academicGroupId || !payload.subjectId || !payload.title?.trim() || !payload.description?.trim() || !payload.dueDate) {
    return "Academic group, subject, title, description, and due date are required";
  }

  const academicGroup = await AcademicGroup.findOne({
    _id: payload.academicGroupId,
    instituteId,
    isDeleted: false,
  });
  if (!academicGroup) {
    return "Academic group not found for this institute";
  }

  const subject = await Subject.findOne({
    _id: payload.subjectId,
    instituteId,
    academicGroupId: payload.academicGroupId,
    isDeleted: false,
  });
  if (!subject) {
    return "Subject not found for this academic group";
  }

  if (req.user.role === "teacher") {
    if (!ensureTeacherAcademicGroupAccess(req, payload.academicGroupId) || !ensureTeacherSubjectAccess(req, subject)) {
      return "You can only create assignments for your assigned academic groups and subjects";
    }
  }

  return null;
};

const createAssignment = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const validationError = await validateAssignmentPayload(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const teacherId = req.user.role === "teacher" ? req.user._id : req.body.teacherId || req.user._id;
    const assignment = await Assignment.create({
      instituteId,
      academicGroupId: req.body.academicGroupId,
      subjectId: req.body.subjectId,
      teacherId,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      dueDate: req.body.dueDate,
      maxMarks: req.body.maxMarks || null,
      attachment: req.body.attachment?.trim() || "",
      assignmentType: req.body.assignmentType || "assignment",
      status: req.body.status || "draft",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "assignment",
      entityId: assignment._id,
      message: "Assignment created",
    });

    res.status(201).json({ message: "Assignment created successfully", assignment: sanitizeAssignment(assignment) });
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };

    if (req.query.academicGroupId && req.query.academicGroupId !== "all") {
      query.academicGroupId = req.query.academicGroupId;
    }
    if (req.query.subjectId && req.query.subjectId !== "all") {
      query.subjectId = req.query.subjectId;
    }
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    if (req.user.role === "teacher") {
      query.teacherId = req.user._id;
    } else if (req.query.teacherId && req.query.teacherId !== "all") {
      query.teacherId = req.query.teacherId;
    }

    const assignments = await populateAssignment(Assignment.find(query).sort({ dueDate: 1, createdAt: -1 }));
    res.json({ assignments: assignments.map(sanitizeAssignment) });
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await populateAssignment(Assignment.findOne({ _id: req.params.id, isDeleted: false }));
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (!ensureInstituteScope(req, assignment.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId?._id || assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "student") {
      const student = await getStudentProfileForUser(req.user._id);
      if (!student || String(student.academicGroupId || "") !== String(assignment.academicGroupId?._id || assignment.academicGroupId || "")) {
        res.status(403);
        throw new Error("Access denied for this assignment");
      }
    }

    res.json({ assignment: sanitizeAssignment(assignment) });
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: false });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (!ensureInstituteScope(req, assignment.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }

    const validationError = await validateAssignmentPayload(req, { ...assignment.toObject(), ...req.body });
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    assignment.academicGroupId = req.body.academicGroupId ?? assignment.academicGroupId;
    assignment.subjectId = req.body.subjectId ?? assignment.subjectId;
    assignment.title = req.body.title?.trim() ?? assignment.title;
    assignment.description = req.body.description?.trim() ?? assignment.description;
    assignment.dueDate = req.body.dueDate ?? assignment.dueDate;
    assignment.maxMarks = req.body.maxMarks ?? assignment.maxMarks;
    assignment.attachment = req.body.attachment?.trim() ?? assignment.attachment;
    assignment.assignmentType = req.body.assignmentType ?? assignment.assignmentType;
    assignment.status = req.body.status ?? assignment.status;
    assignment.updatedBy = req.user._id;
    await assignment.save();

    await createAuditLog({
      req,
      instituteId: assignment.instituteId,
      action: "update",
      entity: "assignment",
      entityId: assignment._id,
      message: "Assignment updated",
    });

    res.json({ message: "Assignment updated successfully", assignment: sanitizeAssignment(assignment) });
  } catch (error) {
    next(error);
  }
};

const updateAssignmentStatus = async (req, res, next) => {
  try {
    if (!["draft", "published", "closed"].includes(req.body.status)) {
      res.status(400);
      throw new Error("Status must be draft, published, or closed");
    }

    const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: false });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (!ensureInstituteScope(req, assignment.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }

    assignment.status = req.body.status;
    assignment.updatedBy = req.user._id;
    await assignment.save();

    // Notify students when assignment is published
    if (req.body.status === "published" && assignment.academicGroupId) {
      const studentUserIds = await getUserIdsByRole("student", assignment.instituteId, assignment.academicGroupId);
      if (studentUserIds.length > 0) {
        await createNotification({
          instituteId: assignment.instituteId,
          recipientUserId: studentUserIds,
          title: `New Assignment: ${assignment.title}`,
          message: assignment.description.substring(0, 200) + (assignment.description.length > 200 ? "..." : ""),
          type: "assignment",
          link: `/student/assignments`,
          priority: assignment.dueDate && new Date(assignment.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? "high" : "normal",
          createdBy: req.user._id,
          metadata: { assignmentId: assignment._id },
        });
      }
    }

    await createAuditLog({
      req,
      instituteId: assignment.instituteId,
      action: "status_update",
      entity: "assignment",
      entityId: assignment._id,
      message: `Assignment marked ${req.body.status}`,
    });

    res.json({ message: "Assignment status updated successfully", assignment: sanitizeAssignment(assignment) });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: false });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (!ensureInstituteScope(req, assignment.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }

    assignment.isDeleted = true;
    assignment.deletedAt = new Date();
    assignment.status = "closed";
    assignment.updatedBy = req.user._id;
    await assignment.save();

    await createAuditLog({
      req,
      instituteId: assignment.instituteId,
      action: "soft_delete",
      entity: "assignment",
      entityId: assignment._id,
      message: "Assignment deleted",
    });

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getMyAssignments = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const assignments = await populateAssignment(
      Assignment.find({
        instituteId: student.instituteId,
        academicGroupId: student.academicGroupId,
        isDeleted: false,
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    const submissions = await AssignmentSubmission.find({
      instituteId: student.instituteId,
      studentId: student._id,
      isDeleted: false,
    });
    const submissionMap = new Map(submissions.map((submission) => [String(submission.assignmentId), sanitizeAssignmentSubmission(submission)]));

    res.json({
      assignments: assignments.map((assignment) => ({
        ...sanitizeAssignment(assignment),
        submission: submissionMap.get(String(assignment._id)) || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getChildAssignments = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({ _id: req.params.studentId, instituteId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const assignments = await populateAssignment(
      Assignment.find({
        instituteId,
        academicGroupId: student.academicGroupId,
        isDeleted: false,
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    const submissions = await AssignmentSubmission.find({
      instituteId,
      studentId: student._id,
      isDeleted: false,
    });
    const submissionMap = new Map(submissions.map((submission) => [String(submission.assignmentId), sanitizeAssignmentSubmission(submission)]));

    res.json({
      assignments: assignments.map((assignment) => ({
        ...sanitizeAssignment(assignment),
        submission: submissionMap.get(String(assignment._id)) || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const submitAssignment = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      instituteId: student.instituteId,
      academicGroupId: student.academicGroupId,
      isDeleted: false,
    });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (assignment.status === "closed") {
      res.status(400);
      throw new Error("Submission is not allowed for closed assignments");
    }

    let submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: student._id,
      isDeleted: false,
    });

    const submittedAt = new Date();
    const status = submittedAt > new Date(assignment.dueDate) ? "late" : "submitted";

    if (!submission) {
      submission = await AssignmentSubmission.create({
        instituteId: student.instituteId,
        assignmentId: assignment._id,
        studentId: student._id,
        answerText: req.body.answerText?.trim() || "",
        attachment: req.body.attachment?.trim() || "",
        submittedAt,
        status,
      });
    } else {
      submission.answerText = req.body.answerText?.trim() || "";
      submission.attachment = req.body.attachment?.trim() || "";
      submission.submittedAt = submittedAt;
      submission.status = submission.status === "reviewed" ? "reviewed" : status;
      await submission.save();
    }

    await createAuditLog({
      req,
      instituteId: student.instituteId,
      action: "submit",
      entity: "assignment_submission",
      entityId: submission._id,
      message: "Assignment submitted",
      metadata: { assignmentId: assignment._id },
    });

    res.status(201).json({ message: "Assignment submitted successfully", submission: sanitizeAssignmentSubmission(submission) });
  } catch (error) {
    next(error);
  }
};

const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: false });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (!ensureInstituteScope(req, assignment.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this assignment");
    }

    const submissions = await populateSubmission(
      AssignmentSubmission.find({
        instituteId: assignment.instituteId,
        assignmentId: assignment._id,
        isDeleted: false,
      }).sort({ submittedAt: -1 })
    );

    res.json({ submissions: submissions.map(sanitizeAssignmentSubmission) });
  } catch (error) {
    next(error);
  }
};

const reviewAssignmentSubmission = async (req, res, next) => {
  try {
    const submission = await AssignmentSubmission.findOne({ _id: req.params.submissionId, isDeleted: false });
    if (!submission) {
      res.status(404);
      throw new Error("Assignment submission not found");
    }
    if (!ensureInstituteScope(req, submission.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this submission");
    }

    const assignment = await Assignment.findOne({ _id: submission.assignmentId, isDeleted: false });
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }
    if (req.user.role === "teacher" && String(assignment.teacherId || "") !== String(req.user._id)) {
      res.status(403);
      throw new Error("Access denied for this submission");
    }

    submission.marksObtained = req.body.marksObtained ?? submission.marksObtained;
    submission.feedback = req.body.feedback?.trim() ?? submission.feedback;
    submission.reviewedBy = req.user._id;
    submission.status = "reviewed";
    await submission.save();

    // Notify student when submission is reviewed
    const student = await Student.findById(submission.studentId).select("userId");
    if (student) {
      await createNotification({
        instituteId: submission.instituteId,
        recipientUserId: student.userId,
        title: `Assignment Reviewed: ${assignment.title}`,
        message: `Your assignment has been reviewed. Marks: ${submission.marksObtained}/${assignment.maxMarks || "N/A"}${submission.feedback ? `. Feedback: ${submission.feedback}` : ""}`,
        type: "assignment",
        link: `/student/assignments`,
        priority: "normal",
        createdBy: req.user._id,
        metadata: { assignmentId: assignment._id, submissionId: submission._id },
      });
    }

    await createAuditLog({
      req,
      instituteId: submission.instituteId,
      action: "review",
      entity: "assignment_submission",
      entityId: submission._id,
      message: "Assignment submission reviewed",
      metadata: { assignmentId: assignment._id },
    });

    res.json({ message: "Submission reviewed successfully", submission: sanitizeAssignmentSubmission(submission) });
  } catch (error) {
    next(error);
  }
};

export {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  updateAssignmentStatus,
  deleteAssignment,
  getMyAssignments,
  getChildAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  reviewAssignmentSubmission,
};
