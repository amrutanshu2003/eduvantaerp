import express from "express";
import {
  createFee,
  deleteFee,
  getChildFees,
  getFeeById,
  getFees,
  getFeesByStudentId,
  getMyFees,
  markFeePayment,
  updateFee,
} from "../controllers/feeController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my-fees", allowRoles("student"), getMyFees);
router.get("/student/:studentId", allowRoles("admin", "superadmin"), getFeesByStudentId);
router.get("/child/:studentId", allowRoles("parent"), getChildFees);
router.get("/", allowRoles("admin", "superadmin"), getFees);
router.get("/:id", allowRoles("admin", "superadmin"), getFeeById);
router.post("/", allowRoles("admin", "superadmin"), createFee);
router.put("/:id", allowRoles("admin", "superadmin"), updateFee);
router.patch("/:id/payment", allowRoles("admin", "superadmin"), markFeePayment);
router.delete("/:id", allowRoles("admin", "superadmin"), deleteFee);

export default router;
