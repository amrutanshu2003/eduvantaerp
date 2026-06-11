import mongoose from "mongoose";

const academicGroupSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    instituteType: {
      type: String,
      enum: ["school", "college", "university"],
      required: true,
    },
    schoolLevel: {
      type: String,
      enum: ["Pre-Primary", "Primary", "Middle", "Secondary", "Higher Secondary", null],
      default: null,
    },
    className: {
      type: String,
      default: "",
      trim: true,
    },
    programLevel: {
      type: String,
      enum: ["UG", "PG", "PhD", "Diploma", "Certificate", null],
      default: null,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    course: {
      type: String,
      default: "",
      trim: true,
    },
    semester: {
      type: String,
      default: "",
      trim: true,
    },
    year: {
      type: String,
      default: "",
      trim: true,
    },
    batch: {
      type: String,
      default: "",
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    dynamicFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mentorOrClassTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AcademicGroup = mongoose.model("AcademicGroup", academicGroupSchema);

export default AcademicGroup;
