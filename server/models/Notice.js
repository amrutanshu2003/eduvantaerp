import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    noticeType: {
      type: String,
      enum: ["general", "academic", "exam", "fees", "holiday", "event", "emergency"],
      default: "general",
    },
    audience: {
      type: String,
      enum: ["all", "admins", "teachers", "students", "parents", "staff", "academic_group"],
      default: "all",
    },
    academicGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicGroup",
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      default: null,
    },
    createdByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember"],
      default: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "updatedByModel",
      default: null,
    },
    updatedByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember"],
      default: "Admin",
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

noticeSchema.index({ instituteId: 1, status: 1, audience: 1, publishDate: -1 });

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
