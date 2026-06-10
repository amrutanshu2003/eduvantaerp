import mongoose from "mongoose";

const auditLogSettingsSchema = new mongoose.Schema(
  {
    autoDeleteEnabled: {
      type: Boolean,
      default: false,
    },
    retentionPeriod: {
      type: String,
      enum: ["3months", "6months", "1year", "custom"],
      default: "6months",
    },
    customRetentionDays: {
      type: Number,
      default: 180,
      min: 7,
      max: 3650,
    },
    lastAutoDeleteRun: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSettingsSchema.index(
  {},
  {
    unique: true,
  }
);

const AuditLogSettings = mongoose.model("AuditLogSettings", auditLogSettingsSchema);

export default AuditLogSettings;
