import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the student 'demo' and change their phone to avoid collision
    const demoStudent = await User.findOne({ email: "demostudent@gmail.com" });
    if (demoStudent) {
      demoStudent.phone = "1234567899"; // unique phone
      await demoStudent.save();
      console.log("Student 'demo' phone updated to 1234567899");
    }

    // Now restore the teacher to active state so we can let the user delete it cleanly
    const teacher = await User.findOne({ email: "demoteacher@gmail.com" });
    if (teacher) {
      teacher.isDeleted = false;
      teacher.deletedAt = null;
      teacher.recycleBinExpiresAt = null;
      teacher.status = "active";
      teacher.password = "Teacher@123";
      await teacher.save();
      console.log("Teacher restored to active with email demoteacher@gmail.com and password Teacher@123");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
