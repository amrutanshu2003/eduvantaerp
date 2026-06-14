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
    sidebarColor: {
      type: String,
      default: "#0f172a",
    },
    loginBackground: {
      type: String,
      default: "",
    },
    loginBackgroundEnabled: {
      type: Boolean,
      default: false,
    },
    loginBackgroundImageUrl: {
      type: String,
      default: "",
    },
    loginBackgroundOverlayEnabled: {
      type: Boolean,
      default: true,
    },
    loginBackgroundOverlayOpacity: {
      type: Number,
      default: 0.72,
      min: 0,
      max: 1,
    },
    loginBackgroundBlurEnabled: {
      type: Boolean,
      default: false,
    },
    loginPanelImageEnabled: {
      type: Boolean,
      default: false,
    },
    loginPanelImageUrl: {
      type: String,
      default: "",
    },
    loginPanelImagePosition: {
      type: String,
      enum: ["background", "top", "hidden"],
      default: "hidden",
    },
    loginPanelImageOverlayEnabled: {
      type: Boolean,
      default: true,
    },
    loginPanelImageOverlayOpacity: {
      type: Number,
      default: 0.36,
      min: 0,
      max: 1,
    },
    loginBrandEyebrow: {
      type: String,
      default: "EDUVANTA ERP",
      trim: true,
    },
    loginBrandSubtitle: {
      type: String,
      default: "Connected campus operations",
      trim: true,
    },
    loginHeroTitle: {
      type: String,
      default: "Smart ERP for Schools, Colleges & Universities",
      trim: true,
    },
    loginHeroDescription: {
      type: String,
      default: "Manage academics, students, staff, fees, attendance, hostel, transport and more from one smart ERP platform.",
      trim: true,
    },
    loginLeftPanelAccentColor: {
      type: String,
      default: "#ccfbf1",
    },
    loginLeftPanelAccentLightColor: {
      type: String,
      default: "#f0fdfa",
    },
    loginHeroTitleColor: {
      type: String,
      default: "#ffffff",
    },
    loginHeroTitleLightColor: {
      type: String,
      default: "#f8fafc",
    },
    loginHeroBodyColor: {
      type: String,
      default: "#e2e8f0",
    },
    loginHeroBodyLightColor: {
      type: String,
      default: "#f8fafc",
    },
    loginFooterText: {
      type: String,
      default: "Smart ERP for Schools, Colleges & Universities",
      trim: true,
    },
    loginFooterTextColor: {
      type: String,
      default: "#e2e8f0",
    },
    loginFooterTextLightColor: {
      type: String,
      default: "#f8fafc",
    },
    loginFormEyebrow: {
      type: String,
      default: "SECURE SIGN IN",
      trim: true,
    },
    loginFormTitle: {
      type: String,
      default: "Access your role dashboard",
      trim: true,
    },
    loginFormDescription: {
      type: String,
      default: "Sign in to continue to Eduvanta ERP and manage your institute workflows securely.",
      trim: true,
    },
    loginButtonText: {
      type: String,
      default: "Login to Eduvanta ERP",
      trim: true,
    },
    showLoginBrandBlock: {
      type: Boolean,
      default: true,
    },
    showLoginHeroTitle: {
      type: Boolean,
      default: true,
    },
    showLoginHeroDescription: {
      type: Boolean,
      default: true,
    },
    showLoginFeatureCards: {
      type: Boolean,
      default: true,
    },
    showLoginCopyright: {
      type: Boolean,
      default: true,
    },
    showLoginThemeToggle: {
      type: Boolean,
      default: true,
    },
    showLoginAcceptedUsernameHint: {
      type: Boolean,
      default: true,
    },
    showLoginRememberMe: {
      type: Boolean,
      default: true,
    },
    loginFeatureCard1Enabled: {
      type: Boolean,
      default: true,
    },
    loginFeatureCard1Title: {
      type: String,
      default: "Academic operations",
      trim: true,
    },
    loginFeatureCard1Description: {
      type: String,
      default: "Centralize classes, notices, assignments, exams and attendance in one place.",
      trim: true,
    },
    loginFeatureCard2Enabled: {
      type: Boolean,
      default: true,
    },
    loginFeatureCard2Title: {
      type: String,
      default: "Campus services",
      trim: true,
    },
    loginFeatureCard2Description: {
      type: String,
      default: "Track hostel, transport, fees, library and staff workflows with role-based access.",
      trim: true,
    },
    loginCleanModeEnabled: {
      type: Boolean,
      default: false,
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
    showFooter: {
      type: Boolean,
      default: true,
    },
    captchaEnabled: {
      type: Boolean,
      default: true,
    },
    attendanceGoodThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    attendanceWarningThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    attendanceGoodColor: {
      type: String,
      default: "#16a34a",
      trim: true,
    },
    attendanceWarningColor: {
      type: String,
      default: "#f8e58c",
      trim: true,
    },
    attendanceCriticalColor: {
      type: String,
      default: "#ef4444",
      trim: true,
    },
    privilegedRecoveryEnabled: {
      type: Boolean,
      default: false,
    },
    privilegedRecoveryHint: {
      type: String,
      default: "",
      trim: true,
    },
    customSidebarItems: {
      type: [
        {
          label: {
            type: String,
            required: true,
            trim: true,
          },
          path: {
            type: String,
            required: true,
            trim: true,
          },
          iconKey: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
    },
    privilegedRecoveryKeyHash: {
      type: String,
      default: "",
      select: false,
    },
    academicConfig: {
      school: {
        allowedSchoolLevels: {
          type: [String],
          default: ["Pre-Primary", "Primary", "Middle", "Secondary"],
        },
        maxClassNumber: {
          type: Number,
          default: 10,
        },
      },
      college: {
        allowedSchoolLevels: {
          type: [String],
          default: ["Higher Secondary"],
        },
        allowedProgramLevels: {
          type: [String],
          default: ["UG", "PG", "Diploma", "Certificate"],
        },
        maxClassNumber: {
          type: Number,
          default: 12,
        },
      },
      university: {
        allowedProgramLevels: {
          type: [String],
          default: ["UG", "PG", "PhD", "Diploma", "Certificate"],
        },
      },
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
