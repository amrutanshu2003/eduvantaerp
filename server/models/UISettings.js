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
    captchaEnabled: {
      type: Boolean,
      default: true,
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
