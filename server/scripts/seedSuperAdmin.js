import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: "superadmin@eduvanta.com" });

    if (existingUser) {
      if (existingUser.isDeleted !== false || existingUser.status !== "active") {
        existingUser.isDeleted = false;
        existingUser.status = "active";
        await existingUser.save();
        console.log("Super admin normalized successfully");
        process.exit(0);
      }

      console.log("Super admin already exists");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      email: "superadmin@eduvanta.com",
      password: "SuperAdmin@123",
      role: "superadmin",
      permissions: ["*"],
      status: "active",
    });

    console.log("Super admin seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
