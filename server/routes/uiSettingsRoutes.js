import express from "express";
import { getGlobalUISettings, updateGlobalUISettings } from "../controllers/uiSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/global", getGlobalUISettings);
router.put("/global", protect, allowRoles("superadmin"), updateGlobalUISettings);

export default router;
