import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "teacher", "student", "parent", "staff"],
      required: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    employeeId: {
      type: String,
      trim: true,
      default: "",
    },
    qualification: {
      type: String,
      trim: true,
      default: "",
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    assignedAcademicGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicGroup",
      },
    ],
    relation: {
      type: String,
      enum: ["father", "mother", "guardian", "other", null],
      default: null,
    },
    linkedStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    address: {
      type: String,
      trim: true,
      default: "",
    },
    staffId: {
      type: String,
      trim: true,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    salary: {
      type: Number,
      default: null,
    },
    designation: {
      type: String,
      enum: [
        "accountant",
        "librarian",
        "receptionist",
        "security_guard",
        "transport_staff",
        "driver",
        "cleaner",
        "peon",
        "lab_assistant",
        "hostel_warden",
        "mess_manager",
        "hostel_security",
        "nurse",
        "exam_coordinator",
      ],
      default: null,
    },
    permissions: {
      type: [String],
      default: [],
    },
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
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      phone: { $type: "string", $gt: "" },
    },
  }
);

userSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      employeeId: { $type: "string", $gt: "" },
    },
  }
);

userSchema.index(
  { staffId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      staffId: { $type: "string", $gt: "" },
    },
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
