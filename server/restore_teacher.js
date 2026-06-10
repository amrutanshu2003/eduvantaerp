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
      await teacher.save();
      console.log("Teacher restored successfully");
    } else {
      console.log("No teacher found to restore");
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
