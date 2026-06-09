import express from "express";
import {
  createParent,
  deleteParent,
  getParentById,
  getParents,
  linkStudentsToParent,
  updateParent,
  updateParentStatus,
} from "../controllers/parentController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "superadmin"));

router.route("/").post(createParent).get(getParents);
router.patch("/:id/link-students", linkStudentsToParent);
router.patch("/:id/status", updateParentStatus);
router.route("/:id").get(getParentById).put(updateParent).delete(deleteParent);

export default router;
