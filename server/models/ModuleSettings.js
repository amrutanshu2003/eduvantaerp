import mongoose from "mongoose";

const moduleSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null, // null means global settings
    },
    modules: {
      academics: {
        type: Boolean,
        default: true,
      },
      students: {
        type: Boolean,
        default: true,
      },
      teachers: {
        type: Boolean,
        default: true,
      },
      parents: {
        type: Boolean,
        default: true,
      },
      staff: {
        type: Boolean,
        default: true,
      },
      subjects: {
        type: Boolean,
        default: true,
      },
      attendance: {
        type: Boolean,
        default: true,
      },
      exams: {
        type: Boolean,
        default: true,
      },
      marks: {
        type: Boolean,
        default: true,
      },
      fees: {
        type: Boolean,
        default: true,
      },
      notices: {
        type: Boolean,
        default: true,
      },
      timetable: {
        type: Boolean,
        default: true,
      },
      assignments: {
        type: Boolean,
        default: true,
      },
      library: {
        type: Boolean,
        default: true,
      },
      transport: {
        type: Boolean,
        default: true,
      },
      hostel: {
        type: Boolean,
        default: true,
      },
      payroll: {
        type: Boolean,
        default: false,
      },
      reports: {
        type: Boolean,
        default: true,
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

const ModuleSettings = mongoose.model("ModuleSettings", moduleSettingsSchema);

export default ModuleSettings;
