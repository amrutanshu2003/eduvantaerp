import mongoose from "mongoose";

const transportVehicleSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["bus", "van", "auto", "car", "other"],
      default: "bus",
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffMember",
      default: null,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffMember",
      default: null,
    },
    insuranceExpiry: {
      type: Date,
      default: null,
    },
    pollutionExpiry: {
      type: Date,
      default: null,
    },
    fitnessExpiry: {
      type: Date,
      default: null,
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

transportVehicleSchema.index(
  { instituteId: 1, vehicleNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

const TransportVehicle = mongoose.model("TransportVehicle", transportVehicleSchema);

export default TransportVehicle;
