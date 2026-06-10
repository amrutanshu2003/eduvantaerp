import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const staffMemberSchema = new mongoose.Schema(
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
      default: "staff",
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    staffId: {
      type: String,
      trim: true,
      default: "",
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
    joiningDate: {
      type: Date,
      default: null,
    },
    salary: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: "",
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
  }
);

staffMemberSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

staffMemberSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      phone: { $type: "string", $gt: "" },
    },
  }
);

staffMemberSchema.index(
  { staffId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      staffId: { $type: "string", $gt: "" },
    },
  }
);

staffMemberSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

staffMemberSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const StaffMember = mongoose.model("StaffMember", staffMemberSchema);

export default StaffMember;
