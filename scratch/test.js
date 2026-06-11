import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../server/config/db.js";
import Attendance from "../server/models/Attendance.js";

// Load env
dotenv.config({ path: "../server/.env" });

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("DB Connected. Querying attendance...");
    
    // Check registered models
    console.log("Registered models before import:", Object.keys(mongoose.models));
    
    const records = await Attendance.find({}).populate("markedBy").limit(1);
    console.log("Successfully fetched attendance records:", records);
  } catch (error) {
    console.error("CRITICAL ERROR IN QUERY:", error);
  } finally {
    await mongoose.connection.close();
  }
};

run();
