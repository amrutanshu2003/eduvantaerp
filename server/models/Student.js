import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number!`,
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      default: "student",
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
        ref: "Parent",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    recycleBinExpiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      default: null,
    },
    createdByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember"],
      default: "Admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for backward compatibility where populate("userId") was used
studentSchema.virtual("userId").get(function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    status: this.status,
    role: this.role,
  };
});

studentSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

studentSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      phone: { $type: "string", $gt: "" },
    },
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

studentSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model("Student", studentSchema);

export default Student;
