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
router.get("/student/:studentId", allowRoles("admin"), getFeesByStudentId);
router.get("/child/:studentId", allowRoles("parent"), getChildFees);
router.get("/", allowRoles("admin"), getFees);
router.get("/:id", allowRoles("admin"), getFeeById);
router.post("/", allowRoles("admin"), createFee);
router.put("/:id", allowRoles("admin"), updateFee);
router.patch("/:id/payment", allowRoles("admin"), markFeePayment);
router.delete("/:id", allowRoles("admin"), deleteFee);

export default router;
