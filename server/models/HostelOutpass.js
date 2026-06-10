import mongoose from "mongoose";

const hostelOutpassSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    hostelAllocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostelAllocation",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    parentApprovalRequired: {
      type: Boolean,
      default: true,
    },
    parentApprovalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "pending",
    },
    parentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    parentApprovedAt: {
      type: Date,
      default: null,
    },
    wardenApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    wardenApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffMember",
      default: null,
    },
    wardenApprovedAt: {
      type: Date,
      default: null,
    },
    finalStatus: {
      type: String,
      enum: ["pending", "parent_approved", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      default: null,
    },
    createdByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember", "Student", "Parent"],
      default: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "updatedByModel",
      default: null,
    },
    updatedByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember", "Student", "Parent"],
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

const HostelOutpass = mongoose.model("HostelOutpass", hostelOutpassSchema);

export default HostelOutpass;
