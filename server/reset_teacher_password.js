import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const teacher = await User.findOne({ role: "teacher" });
    if (teacher) {
      teacher.isDeleted = false;
      teacher.deletedAt = null;
      teacher.recycleBinExpiresAt = null;
      teacher.status = "active";
      teacher.password = "Teacher@123";
      await teacher.save();
      console.log("Teacher password reset to 'Teacher@123' and status set to active.");
    } else {
      console.log("No teacher found to reset");
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
