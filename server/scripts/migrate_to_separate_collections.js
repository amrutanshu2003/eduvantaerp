/**
 * Migration Script: Migrate data from users collection to separate role collections
 * 
 * Run: node scripts/migrate_to_separate_collections.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import new models
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration...\n");

    const db = mongoose.connection.db;

    // Get all users from users collection
    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users in the database.`);

    let migratedStudents = 0;
    let migratedTeachers = 0;
    let migratedParents = 0;
    let migratedStaff = 0;
    let migratedAdmins = 0;
    let migratedSuperAdmins = 0;

    // Map to keep track of user roles for createdByModel mapping
    const userRoleMap = {};
    users.forEach(u => {
      userRoleMap[String(u._id)] = u.role;
    });

    const getModelNameForRole = (role) => {
      const roleMap = {
        superadmin: "SuperAdmin",
        admin: "Admin",
        teacher: "Teacher",
        staff: "StaffMember",
        student: "Student",
        parent: "Parent"
      };
      return roleMap[role] || "Admin";
    };

    for (const user of users) {
      const role = user.role;
      const baseFields = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        password: user.password,
        role: user.role,
        instituteId: user.instituteId || null,
        status: user.status || "active",
        profilePhoto: user.profilePhoto || "",
        isDeleted: user.isDeleted || false,
        deletedAt: user.deletedAt || null,
        recycleBinExpiresAt: user.recycleBinExpiresAt || null,
        createdBy: user.createdBy || null,
        createdByModel: user.createdBy ? getModelNameForRole(userRoleMap[String(user.createdBy)]) : "Admin",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      if (role === "student") {
        // Find existing student record by userId or email
        const student = await Student.findOne({
          $or: [{ userId: user._id }, { email: user.email }]
        });
        if (student) {
          // Merge auth fields into Student
          await Student.updateOne(
            { _id: student._id },
            {
              $set: {
                name: baseFields.name,
                email: baseFields.email,
                phone: baseFields.phone,
                password: baseFields.password,
                role: baseFields.role,
                status: baseFields.status,
                profilePhoto: baseFields.profilePhoto,
                isDeleted: baseFields.isDeleted,
                deletedAt: baseFields.deletedAt,
                recycleBinExpiresAt: baseFields.recycleBinExpiresAt,
                createdBy: baseFields.createdBy,
                createdByModel: baseFields.createdByModel,
              },
              $unset: { userId: 1 } // Remove userId
            }
          );
          migratedStudents++;
        } else {
          console.warn(`⚠️ Warning: No student profile found for student user ${user.email}. Creating new Student record.`);
          const rollNumber = `ROLL-${user._id.toString().slice(-6).toUpperCase()}`;
          const admissionNumber = `ADM-${user._id.toString().slice(-6).toUpperCase()}`;
          await Student.create({
            _id: user._id,
            ...baseFields,
            rollNumber,
            admissionNumber,
          });
          migratedStudents++;
        }
      } else if (role === "teacher") {
        await Teacher.replaceOne(
          { _id: user._id },
          {
            ...baseFields,
            employeeId: user.employeeId || "",
            qualification: user.qualification || "",
            experience: user.experience || "",
            department: user.department || "",
            assignedAcademicGroups: user.assignedAcademicGroups || [],
          },
          { upsert: true }
        );
        migratedTeachers++;
      } else if (role === "parent") {
        await Parent.replaceOne(
          { _id: user._id },
          {
            ...baseFields,
            relation: user.relation || null,
            linkedStudentIds: user.linkedStudentIds || [],
            address: user.address || "",
          },
          { upsert: true }
        );
        migratedParents++;
      } else if (role === "staff") {
        await StaffMember.replaceOne(
          { _id: user._id },
          {
            ...baseFields,
            staffId: user.staffId || "",
            designation: user.designation || null,
            joiningDate: user.joiningDate || null,
            salary: user.salary || null,
            address: user.address || "",
            permissions: user.permissions || [],
          },
          { upsert: true }
        );
        migratedStaff++;
      } else if (role === "admin") {
        await Admin.replaceOne(
          { _id: user._id },
          {
            ...baseFields,
            permissions: user.permissions || [],
          },
          { upsert: true }
        );
        migratedAdmins++;
      } else if (role === "superadmin") {
        // SuperAdmin does not have instituteId
        delete baseFields.instituteId;
        await SuperAdmin.replaceOne(
          { _id: user._id },
          {
            ...baseFields,
            permissions: user.permissions || [],
          },
          { upsert: true }
        );
        migratedSuperAdmins++;
      }
    }

    console.log("\nMigration completed successfully:");
    console.log(`- Students updated: ${migratedStudents}`);
    console.log(`- Teachers created: ${migratedTeachers}`);
    console.log(`- Parents created: ${migratedParents}`);
    console.log(`- Staff created: ${migratedStaff}`);
    console.log(`- Admins created: ${migratedAdmins}`);
    console.log(`- SuperAdmins created: ${migratedSuperAdmins}`);

    // Update parentIds references in Student (pointing to parent collection now, IDs remain same but refs change)
    const studentsWithoutUserId = await Student.find({ userId: { $exists: true } });
    if (studentsWithoutUserId.length > 0) {
      console.log(`\nUnsetting remaining userId fields on ${studentsWithoutUserId.length} students...`);
      await Student.updateMany({}, { $unset: { userId: 1 } });
    }

    console.log("\nMigration completed successfully! 🎉");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrate();
