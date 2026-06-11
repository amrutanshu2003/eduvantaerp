import mongoose from "mongoose";

const erpSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null, // null means global settings
    },
    appName: {
      type: String,
      default: "Eduvanta ERP",
      trim: true,
    },
    appShortName: {
      type: String,
      default: "Eduvanta",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Complete Institution Management System",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    favicon: {
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
    accentColor: {
      type: String,
      default: "#3b82f6",
    },
    sidebarColor: {
      type: String,
      default: "#0f172a",
    },
    navbarColor: {
      type: String,
      default: "#ffffff",
    },
    backgroundColor: {
      type: String,
      default: "#f8fafc",
    },
    cardColor: {
      type: String,
      default: "#ffffff",
    },
    textColor: {
      type: String,
      default: "#1e293b",
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
    loginLayout: {
      type: String,
      enum: ["split", "centered", "minimal"],
      default: "split",
    },
    loginBackground: {
      type: String,
      default: "",
    },
    loginHeroTitle: {
      type: String,
      default: "Welcome Back",
      trim: true,
    },
    loginHeroSubtitle: {
      type: String,
      default: "Sign in to access your dashboard",
      trim: true,
    },
    footerText: {
      type: String,
      default: "© 2024 Eduvanta ERP. All rights reserved.",
      trim: true,
    },
    enableDarkMode: {
      type: Boolean,
      default: true,
    },
    enableCaptcha: {
      type: Boolean,
      default: false,
    },
    enableRememberMe: {
      type: Boolean,
      default: true,
    },
    enableForgotPassword: {
      type: Boolean,
      default: true,
    },
    defaultLanguage: {
      type: String,
      default: "en",
    },
    dateFormat: {
      type: String,
      default: "DD/MM/YYYY",
    },
    timeFormat: {
      type: String,
      default: "12h",
    },
    currency: {
      type: String,
      default: "USD",
    },
    timezone: {
      type: String,
      default: "UTC",
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

const ERPSettings = mongoose.model("ERPSettings", erpSettingsSchema);

export default ERPSettings;
