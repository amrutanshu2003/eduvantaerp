import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

import AcademicGroup from "./models/AcademicGroup.js";
import Student from "./models/Student.js";
import Teacher from "./models/Teacher.js";
import Parent from "./models/Parent.js";
import StaffMember from "./models/StaffMember.js";
import Subject from "./models/Subject.js";
import Attendance from "./models/Attendance.js";
import Exam from "./models/Exam.js";
import Fee from "./models/Fee.js";
import Notice from "./models/Notice.js";
import Timetable from "./models/Timetable.js";
import Assignment from "./models/Assignment.js";
import LibraryBook from "./models/LibraryBook.js";
import BookIssue from "./models/BookIssue.js";
import TransportVehicle from "./models/TransportVehicle.js";
import TransportRoute from "./models/TransportRoute.js";
import TransportAllocation from "./models/TransportAllocation.js";
import Hostel from "./models/Hostel.js";
import HostelRoom from "./models/HostelRoom.js";
import HostelBed from "./models/HostelBed.js";
import HostelAllocation from "./models/HostelAllocation.js";
import HostelOutpass from "./models/HostelOutpass.js";
import HostelComplaint from "./models/HostelComplaint.js";
import Marks from "./models/Marks.js";

const models = [
  AcademicGroup,
  Student,
  Teacher,
  Parent,
  StaffMember,
  Subject,
  Attendance,
  Exam,
  Fee,
  Notice,
  Timetable,
  Assignment,
  LibraryBook,
  BookIssue,
  TransportVehicle,
  TransportRoute,
  TransportAllocation,
  Hostel,
  HostelRoom,
  HostelBed,
  HostelAllocation,
  HostelOutpass,
  HostelComplaint,
  Marks
];

async function run() {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduvanta-erp";
    console.log("Connecting to MongoDB at:", mongoURI);
    await mongoose.connect(mongoURI);
    console.log("Connected successfully. Creating compound indexes on { instituteId: 1, isDeleted: 1 }...");

    for (const Model of models) {
      console.log(`Creating index for model: ${Model.modelName}...`);
      await Model.collection.createIndex({ instituteId: 1, isDeleted: 1 });
    }

    console.log("All indexes created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating indexes:", error);
    process.exit(1);
  }
}

run();
