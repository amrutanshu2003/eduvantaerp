import express from "express";
import {
  createAllocation,
  createRoute,
  createVehicle,
  deleteAllocation,
  deleteRoute,
  deleteVehicle,
  getAllocationById,
  getAllocations,
  getAllocationsByStudentId,
  getChildTransport,
  getDriverMyRoute,
  getDriverMyStudents,
  getMyTransport,
  getRouteById,
  getRoutes,
  getSupportData,
  getVehicleById,
  getVehicles,
  updateAllocation,
  updateAllocationStatus,
  updateRoute,
  updateRouteStatus,
  updateVehicle,
  updateVehicleStatus,
} from "../controllers/transportController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireDriver, requireTransportManager } from "../utils/transportAccess.js";

const router = express.Router();

router.use(protect);

router.get("/allocations/my-transport", allowRoles("student"), getMyTransport);
router.get("/allocations/child/:studentId", allowRoles("parent"), getChildTransport);

router.get("/driver/my-route", requireDriver, getDriverMyRoute);
router.get("/driver/my-students", requireDriver, getDriverMyStudents);

router.get("/support-data", requireTransportManager, getSupportData);

router
  .route("/vehicles")
  .post(requireTransportManager, createVehicle)
  .get(requireTransportManager, getVehicles);
router.patch("/vehicles/:id/status", requireTransportManager, updateVehicleStatus);
router
  .route("/vehicles/:id")
  .get(requireTransportManager, getVehicleById)
  .put(requireTransportManager, updateVehicle)
  .delete(allowRoles("admin", "superadmin"), deleteVehicle);

router
  .route("/routes")
  .post(requireTransportManager, createRoute)
  .get(requireTransportManager, getRoutes);
router.patch("/routes/:id/status", requireTransportManager, updateRouteStatus);
router
  .route("/routes/:id")
  .get(requireTransportManager, getRouteById)
  .put(requireTransportManager, updateRoute)
  .delete(allowRoles("admin", "superadmin"), deleteRoute);

router
  .route("/allocations")
  .post(requireTransportManager, createAllocation)
  .get(requireTransportManager, getAllocations);
router.get("/allocations/student/:studentId", requireTransportManager, getAllocationsByStudentId);
router.patch("/allocations/:id/status", requireTransportManager, updateAllocationStatus);
router
  .route("/allocations/:id")
  .get(requireTransportManager, getAllocationById)
  .put(requireTransportManager, updateAllocation)
  .delete(allowRoles("admin", "superadmin"), deleteAllocation);

export default router;
