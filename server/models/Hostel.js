import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    hostelName: {
      type: String,
      required: true,
      trim: true,
    },
    hostelCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    hostelType: {
      type: String,
      enum: ["boys", "girls", "co_ed"],
      required: true,
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    wardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffMember",
      default: null,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "updatedByModel",
      default: null,
    },
    updatedByModel: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Teacher", "StaffMember"],
      default: "Admin",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

hostelSchema.index(
  { instituteId: 1, hostelCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel;
