import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import { getRecycleBinExpiryDate } from "./utils/recycleBin.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const teacher = await User.findOne({ role: "teacher", isDeleted: false });
    if (!teacher) {
      console.log("No active teacher found to delete");
      process.exit(0);
    }

    console.log(`Attempting to soft delete: ${teacher.name} (${teacher.email})`);
    
    teacher.isDeleted = true;
    teacher.deletedAt = new Date();
    teacher.recycleBinExpiresAt = getRecycleBinExpiryDate(teacher.deletedAt);
    teacher.status = "inactive";

    await teacher.save();
    console.log("Teacher successfully saved to database with isDeleted = true!");

    // Query it back
    const reloaded = await User.findById(teacher._id);
    console.log("Reloaded teacher state: isDeleted =", reloaded.isDeleted, "status =", reloaded.status);

    // Restore it back so we don't disrupt the user's manual tests
    reloaded.isDeleted = false;
    reloaded.deletedAt = null;
    reloaded.recycleBinExpiresAt = null;
    reloaded.status = "active";
    await reloaded.save();
    console.log("Teacher successfully restored back to active state for safety.");

    process.exit(0);
  } catch (error) {
    console.error("Deletion test failed with error:", error);
    process.exit(1);
  }
};

run();
