/**
 * MongoDB Backup Script
 * Exports all collections to JSON files in server/backup/ folder
 * 
 * Run: node scripts/backup_database.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const backup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Create backup folder with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupDir = path.resolve(__dirname, `../backup/${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf-8");

      console.log(`  ✅ ${collectionName}: ${documents.length} documents`);
    }

    console.log(`\n🎉 Backup saved to: ${backupDir}`);

    await mongoose.disconnect();
    console.log("Done.");
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
};

backup();
