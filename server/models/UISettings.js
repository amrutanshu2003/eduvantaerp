import mongoose from "mongoose";

const uiSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    appName: {
      type: String,
      default: "Eduvanta ERP",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    primaryColor: {
      type: String,
      default: "#0f766e",
    },
    secondaryColor: {
      type: String,
      default: "#f59e0b",
    },
    sidebarColor: {
      type: String,
      default: "#0f172a",
    },
    loginBackground: {
      type: String,
      default: "",
    },
    buttonStyle: {
      type: String,
      enum: ["rounded", "pill", "square"],
      default: "rounded",
    },
    themeMode: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    footerText: {
      type: String,
      default: "Smart ERP for Schools, Colleges & Universities",
    },
  },
  {
    timestamps: true,
  }
);

uiSettingsSchema.index(
  { instituteId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      instituteId: { $type: "objectId" },
    },
  }
);

const UISettings = mongoose.model("UISettings", uiSettingsSchema);

export default UISettings;
