import mongoose from "mongoose";

const formSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null, // null means global settings
    },
    entity: {
      type: String,
      enum: ["student", "teacher", "parent", "staff", "fee", "admission", "hostel", "transport"],
      required: true,
    },
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
          enum: ["text", "number", "email", "phone", "date", "select", "textarea", "checkbox"],
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
        placeholder: {
          type: String,
          trim: true,
        },
        showInForm: {
          type: Boolean,
          default: true,
        },
        showInList: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
        autoGenerate: {
          type: Boolean,
          default: false,
        },
        autoGeneratePattern: {
          type: String,
          trim: true,
        },
        defaultValue: {
          type: mongoose.Schema.Types.Mixed,
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

// Compound index to ensure unique entity per institute/global
formSettingsSchema.index({ instituteId: 1, entity: 1 }, { unique: true });

const FormSettings = mongoose.model("FormSettings", formSettingsSchema);

export default FormSettings;
