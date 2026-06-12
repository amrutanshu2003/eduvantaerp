import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import Attendance from "../models/Attendance.js";

// Load env
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("DB Connected. Querying attendance...");
    
    // Check registered models
    console.log("Registered models before import:", Object.keys(mongoose.models));
    
    const records = await Attendance.find({}).populate("markedBy").limit(1);
    console.log("Successfully fetched attendance records:", records.length);
  } catch (error) {
    console.error("CRITICAL ERROR IN QUERY:", error);
  } finally {
    await mongoose.connection.close();
  }
};

run();
