import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import User from "../server/models/User.js";

dotenv.config({ path: fileURLToPath(new URL("../server/.env", import.meta.url)) });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const teachers = await User.find({ role: "teacher" });
    console.log(`Found ${teachers.length} teachers:`);
    for (const t of teachers) {
      console.log(`Name: ${t.name}, Email: ${t.email}, isDeleted: ${t.isDeleted}, status: ${t.status}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
