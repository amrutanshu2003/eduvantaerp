import express from "express";
import { bulkImport } from "../controllers/bulkImportController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "superadmin"));

router.post("/", bulkImport);

export default router;
