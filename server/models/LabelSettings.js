import mongoose from "mongoose";

const labelSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null, // null means global settings
    },
    labels: {
      instituteLabel: {
        type: String,
        default: "Institute",
        trim: true,
      },
      academicGroupLabel: {
        type: String,
        default: "Class",
        trim: true,
      },
      subGroupLabel: {
        type: String,
        default: "Section",
        trim: true,
      },
      teacherLabel: {
        type: String,
        default: "Teacher",
        trim: true,
      },
      parentLabel: {
        type: String,
        default: "Parent",
        trim: true,
      },
      studentLabel: {
        type: String,
        default: "Student",
        trim: true,
      },
      staffLabel: {
        type: String,
        default: "Staff",
        trim: true,
      },
      subjectLabel: {
        type: String,
        default: "Subject",
        trim: true,
      },
      examLabel: {
        type: String,
        default: "Exam",
        trim: true,
      },
      resultLabel: {
        type: String,
        default: "Result",
        trim: true,
      },
      feeLabel: {
        type: String,
        default: "Fee",
        trim: true,
      },
      noticeLabel: {
        type: String,
        default: "Notice",
        trim: true,
      },
      timetableLabel: {
        type: String,
        default: "Timetable",
        trim: true,
      },
      assignmentLabel: {
        type: String,
        default: "Assignment",
        trim: true,
      },
      libraryLabel: {
        type: String,
        default: "Library",
        trim: true,
      },
      transportLabel: {
        type: String,
        default: "Transport",
        trim: true,
      },
      hostelLabel: {
        type: String,
        default: "Hostel",
        trim: true,
      },
      attendanceLabel: {
        type: String,
        default: "Attendance",
        trim: true,
      },
      marksLabel: {
        type: String,
        default: "Marks",
        trim: true,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const LabelSettings = mongoose.model("LabelSettings", labelSettingsSchema);

export default LabelSettings;
