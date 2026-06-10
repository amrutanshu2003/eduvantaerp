import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    academicGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicGroup",
      default: null,
    },
    rollNumber: {
      type: String,
      trim: true,
      required: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
      required: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    admissionDate: {
      type: Date,
      default: null,
    },
    parentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index(
  { rollNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      rollNumber: { $type: "string", $gt: "" },
    },
  }
);

studentSchema.index(
  { admissionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      admissionNumber: { $type: "string", $gt: "" },
    },
  }
);

studentSchema.index(
  { registrationNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      registrationNumber: { $type: "string", $gt: "" },
    },
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
