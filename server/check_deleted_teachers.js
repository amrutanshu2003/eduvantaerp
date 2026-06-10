import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    for (const u of users) {
      console.log(`- ID: ${u._id}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Phone: "${u.phone}"`);
      console.log(`  employeeId: "${u.employeeId}"`);
      console.log(`  staffId: "${u.staffId}"`);
      console.log(`  isDeleted: ${u.isDeleted}`);
      console.log(`  status: ${u.status}`);
      console.log("------------------------");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
