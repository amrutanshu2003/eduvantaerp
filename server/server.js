import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import academicGroupRoutes from "./routes/academicGroupRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import bulkImportRoutes from "./routes/bulkImportRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import hostelAllocationRoutes from "./routes/hostelAllocationRoutes.js";
import hostelBedRoutes from "./routes/hostelBedRoutes.js";
import hostelComplaintRoutes from "./routes/hostelComplaintRoutes.js";
import hostelOutpassRoutes from "./routes/hostelOutpassRoutes.js";
import hostelRoomRoutes from "./routes/hostelRoomRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import instituteRoutes from "./routes/instituteRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import phase4DashboardRoutes from "./routes/phase4DashboardRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import transportRoutes from "./routes/transportRoutes.js";
import uiSettingsRoutes from "./routes/uiSettingsRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://eduvantaerp.pages.dev",
];
const allowedOrigins = (process.env.CLIENT_ORIGINS || defaultAllowedOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/i,
];

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return allowedOriginPatterns.some((pattern) => pattern.test(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Eduvanta ERP API is running",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Eduvanta ERP API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/academic-groups", academicGroupRoutes);
app.use("/api/bulk-import", bulkImportRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/hostel-allocations", hostelAllocationRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/hostel-rooms", hostelRoomRoutes);
app.use("/api/hostel-beds", hostelBedRoutes);
app.use("/api/hostel-outpasses", hostelOutpassRoutes);
app.use("/api/hostel-complaints", hostelComplaintRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/phase4-dashboard", phase4DashboardRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/ui-settings", uiSettingsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
