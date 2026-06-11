import mongoose from "mongoose";

const academicSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null, // null means global settings
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
    levels: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
    fields: [
      {
        fieldKey: {
          type: String,
          required: true,
          trim: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["text", "number", "select", "date"],
          default: "text",
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            type: String,
            trim: true,
          },
        ],
        showInList: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
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

const AcademicSettings = mongoose.model("AcademicSettings", academicSettingsSchema);

export default AcademicSettings;
