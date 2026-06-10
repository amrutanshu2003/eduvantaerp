import Student from "../models/Student.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import TransportVehicle from "../models/TransportVehicle.js";
import StaffMember from "../models/StaffMember.js";
import createAuditLog from "../utils/audit.js";
import { ensureParentStudentAccess, getStudentProfileForUser } from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import {
  sanitizeTransportAllocation,
  sanitizeTransportRoute,
  sanitizeTransportVehicle,
} from "../utils/transportUtils.js";

const vehiclePopulate = [
  { path: "driverId", select: "name email phone designation staffId status" },
  { path: "helperId", select: "name email phone designation staffId status" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const routePopulate = [
  { path: "vehicleId", populate: vehiclePopulate },
  { path: "driverId", select: "name email phone designation staffId status" },
  { path: "helperId", select: "name email phone designation staffId status" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const allocationPopulate = [
  {
    path: "studentId",
    populate: [
      { path: "academicGroupId", select: "className section department course semester year batch" },
    ],
  },
  {
    path: "routeId",
    populate: [
      {
        path: "vehicleId",
        populate: vehiclePopulate,
      },
      { path: "driverId", select: "name email phone designation staffId status" },
      { path: "helperId", select: "name email phone designation staffId status" },
    ],
  },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const normalizeStops = (stops = []) =>
  stops
    .filter((stop) => stop?.stopName?.trim())
    .map((stop, index) => ({
      stopName: stop.stopName.trim(),
      pickupTime: stop.pickupTime?.trim() || "",
      dropTime: stop.dropTime?.trim() || "",
      stopOrder: Number(stop.stopOrder || index + 1),
    }))
    .sort((first, second) => first.stopOrder - second.stopOrder);

const validateStopList = (stops) => {
  if (!stops.length) {
    return "At least one stop is required";
  }

  const orderSet = new Set();
  for (const stop of stops) {
    if (!stop.stopName) {
      return "Each stop must include a stop name";
    }

    if (orderSet.has(stop.stopOrder)) {
      return "Stop order must be unique";
    }

    orderSet.add(stop.stopOrder);
  }

  return "";
};

const getStaffUserById = async (staffId, instituteId, label) => {
  if (!staffId) {
    return null;
  }

  const staff = await StaffMember.findOne({
    _id: staffId,
    instituteId,
    isDeleted: false,
  }).select("-password");

  if (!staff) {
    throw new Error(`${label} not found for this institute`);
  }

  return staff;
};

const validateRouteStaff = async ({ instituteId, driverId, helperId }) => {
  const driver = await getStaffUserById(driverId, instituteId, "Driver");
  const helper = await getStaffUserById(helperId, instituteId, "Helper");

  if (driver && !["driver", "transport_staff"].includes(driver.designation)) {
    throw new Error("Driver must have driver or transport_staff designation");
  }

  return { driver, helper };
};

const populateTransportVehicle = async (vehicleId) => {
  const vehicle = await TransportVehicle.findById(vehicleId).populate(vehiclePopulate);
  return vehicle ? { ...sanitizeTransportVehicle(vehicle), driver: vehicle.driverId, helper: vehicle.helperId } : null;
};

const populateTransportRoute = async (routeId) => {
  const route = await TransportRoute.findById(routeId).populate(routePopulate);
  return route
    ? {
        ...sanitizeTransportRoute(route),
        vehicle: route.vehicleId,
        driver: route.driverId,
        helper: route.helperId,
      }
    : null;
};

const populateTransportAllocation = async (allocationId) => {
  const allocation = await TransportAllocation.findById(allocationId).populate(allocationPopulate);
  return allocation
    ? {
        ...sanitizeTransportAllocation(allocation),
        student: allocation.studentId,
        route: allocation.routeId,
      }
    : null;
};

const buildVehicleQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.vehicleType && req.query.vehicleType !== "all") {
    query.vehicleType = req.query.vehicleType;
  }

  return query;
};

const buildRouteQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.vehicleId && req.query.vehicleId !== "all") {
    query.vehicleId = req.query.vehicleId;
  }

  if (req.query.driverId && req.query.driverId !== "all") {
    query.driverId = req.query.driverId;
  }

  return query;
};

const buildAllocationQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.routeId && req.query.routeId !== "all") {
    query.routeId = req.query.routeId;
  }

  if (req.query.studentId && req.query.studentId !== "all") {
    query.studentId = req.query.studentId;
  }

  return query;
};

const ensureRouteCapacity = async (routeId, excludedAllocationId = null) => {
  const route = await TransportRoute.findOne({ _id: routeId, isDeleted: false }).populate("vehicleId", "capacity");
  if (!route) {
    return;
  }

  if (!route.vehicleId?.capacity) {
    return;
  }

  const capacityQuery = {
    routeId,
    isDeleted: false,
    status: "active",
  };

  if (excludedAllocationId) {
    capacityQuery._id = { $ne: excludedAllocationId };
  }

  const activeAllocationCount = await TransportAllocation.countDocuments(capacityQuery);
  if (activeAllocationCount >= route.vehicleId.capacity) {
    throw new Error("Vehicle capacity exceeded for this route");
  }
};

const resolveRouteStop = (route, stopName) => {
  const normalizedStop = route.stops.find(
    (stop) => stop.stopName.toLowerCase() === String(stopName || "").trim().toLowerCase()
  );

  if (!normalizedStop) {
    throw new Error("Selected stop is not available in the route");
  }

  return normalizedStop;
};

const getSupportData = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const [students, staff] = await Promise.all([
      Student.find({ instituteId, isDeleted: false, status: "active" })
        .populate("academicGroupId", "className section department course semester year batch")
        .sort({ createdAt: -1 }),
      StaffMember.find({
        instituteId,
        isDeleted: false,
        status: "active",
        designation: { $in: ["driver", "transport_staff"] },
      })
        .select("-password")
        .sort({ name: 1 }),
    ]);

    res.json({ students, staff });
  } catch (error) {
    next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const {
      vehicleNumber,
      vehicleType = "bus",
      capacity,
      driverId,
      helperId,
      insuranceExpiry,
      pollutionExpiry,
      fitnessExpiry,
      status = "active",
    } = req.body;

    if (!vehicleNumber?.trim() || !capacity) {
      res.status(400);
      throw new Error("Vehicle number and capacity are required");
    }

    const duplicateVehicle = await TransportVehicle.findOne({
      instituteId,
      vehicleNumber: vehicleNumber.trim(),
      isDeleted: false,
    });
    if (duplicateVehicle) {
      res.status(409);
      throw new Error("Vehicle number already exists for this institute");
    }

    await validateRouteStaff({ instituteId, driverId, helperId });

    const vehicle = await TransportVehicle.create({
      instituteId,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      capacity: Number(capacity),
      driverId: driverId || null,
      helperId: helperId || null,
      insuranceExpiry: insuranceExpiry || null,
      pollutionExpiry: pollutionExpiry || null,
      fitnessExpiry: fitnessExpiry || null,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "transport_vehicle",
      entityId: vehicle._id,
      message: "Transport vehicle created",
    });

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle: await populateTransportVehicle(vehicle._id),
    });
  } catch (error) {
    next(error);
  }
};

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await TransportVehicle.find(buildVehicleQuery(req))
      .populate(vehiclePopulate)
      .sort({ createdAt: -1 });

    const search = req.query.search?.trim().toLowerCase();
    const filteredVehicles = !search
      ? vehicles
      : vehicles.filter(
          (vehicle) =>
            vehicle.vehicleNumber.toLowerCase().includes(search) ||
            vehicle.vehicleType.toLowerCase().includes(search) ||
            vehicle.driverId?.name?.toLowerCase().includes(search)
        );

    res.json({
      vehicles: filteredVehicles.map((vehicle) => ({
        ...sanitizeTransportVehicle(vehicle),
        driver: vehicle.driverId,
        helper: vehicle.helperId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await TransportVehicle.findOne({ _id: req.params.id, isDeleted: false }).populate(vehiclePopulate);
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    if (!ensureInstituteScope(req, vehicle.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this vehicle");
    }

    res.json({
      vehicle: {
        ...sanitizeTransportVehicle(vehicle),
        driver: vehicle.driverId,
        helper: vehicle.helperId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await TransportVehicle.findOne({ _id: req.params.id, isDeleted: false });
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    if (!ensureInstituteScope(req, vehicle.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this vehicle");
    }

    if (req.body.vehicleNumber?.trim() && req.body.vehicleNumber.trim().toUpperCase() !== vehicle.vehicleNumber) {
      const duplicateVehicle = await TransportVehicle.findOne({
        instituteId: vehicle.instituteId,
        vehicleNumber: req.body.vehicleNumber.trim().toUpperCase(),
        isDeleted: false,
        _id: { $ne: vehicle._id },
      });
      if (duplicateVehicle) {
        res.status(409);
        throw new Error("Vehicle number already exists for this institute");
      }
    }

    await validateRouteStaff({
      instituteId: vehicle.instituteId,
      driverId: req.body.driverId ?? vehicle.driverId,
      helperId: req.body.helperId ?? vehicle.helperId,
    });

    Object.assign(vehicle, {
      vehicleNumber: req.body.vehicleNumber?.trim().toUpperCase() ?? vehicle.vehicleNumber,
      vehicleType: req.body.vehicleType ?? vehicle.vehicleType,
      capacity: req.body.capacity ? Number(req.body.capacity) : vehicle.capacity,
      driverId: req.body.driverId !== undefined ? req.body.driverId || null : vehicle.driverId,
      helperId: req.body.helperId !== undefined ? req.body.helperId || null : vehicle.helperId,
      insuranceExpiry: req.body.insuranceExpiry !== undefined ? req.body.insuranceExpiry || null : vehicle.insuranceExpiry,
      pollutionExpiry: req.body.pollutionExpiry !== undefined ? req.body.pollutionExpiry || null : vehicle.pollutionExpiry,
      fitnessExpiry: req.body.fitnessExpiry !== undefined ? req.body.fitnessExpiry || null : vehicle.fitnessExpiry,
      status: req.body.status ?? vehicle.status,
      updatedBy: req.user._id,
    });

    await vehicle.save();

    await createAuditLog({
      req,
      instituteId: vehicle.instituteId,
      action: "update",
      entity: "transport_vehicle",
      entityId: vehicle._id,
      message: "Transport vehicle updated",
    });

    res.json({
      message: "Vehicle updated successfully",
      vehicle: await populateTransportVehicle(vehicle._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateVehicleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive", "maintenance"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active, inactive, or maintenance");
    }

    const vehicle = await TransportVehicle.findOne({ _id: req.params.id, isDeleted: false });
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    if (!ensureInstituteScope(req, vehicle.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this vehicle");
    }

    vehicle.status = status;
    vehicle.updatedBy = req.user._id;
    await vehicle.save();

    await createAuditLog({
      req,
      instituteId: vehicle.instituteId,
      action: "status_update",
      entity: "transport_vehicle",
      entityId: vehicle._id,
      message: `Transport vehicle marked ${status}`,
    });

    res.json({
      message: "Vehicle status updated successfully",
      vehicle: await populateTransportVehicle(vehicle._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await TransportVehicle.findOne({ _id: req.params.id, isDeleted: false });
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    if (!ensureInstituteScope(req, vehicle.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this vehicle");
    }

    vehicle.isDeleted = true;
    vehicle.deletedAt = new Date();
    vehicle.status = "inactive";
    vehicle.updatedBy = req.user._id;
    await vehicle.save();

    await createAuditLog({
      req,
      instituteId: vehicle.instituteId,
      action: "soft_delete",
      entity: "transport_vehicle",
      entityId: vehicle._id,
      message: "Transport vehicle deleted",
    });

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const {
      routeName,
      routeCode,
      vehicleId,
      driverId,
      helperId,
      startPoint,
      endPoint,
      stops = [],
      monthlyFee = 0,
      status = "active",
    } = req.body;

    if (!routeName?.trim() || !routeCode?.trim() || !startPoint?.trim() || !endPoint?.trim()) {
      res.status(400);
      throw new Error("Route name, route code, start point, and end point are required");
    }

    const normalizedStops = normalizeStops(stops);
    const stopError = validateStopList(normalizedStops);
    if (stopError) {
      res.status(400);
      throw new Error(stopError);
    }

    const duplicateRoute = await TransportRoute.findOne({
      instituteId,
      routeCode: routeCode.trim().toUpperCase(),
      isDeleted: false,
    });
    if (duplicateRoute) {
      res.status(409);
      throw new Error("Route code already exists for this institute");
    }

    if (vehicleId) {
      const vehicle = await TransportVehicle.findOne({ _id: vehicleId, instituteId, isDeleted: false });
      if (!vehicle) {
        res.status(400);
        throw new Error("Vehicle not found for this institute");
      }
    }

    await validateRouteStaff({ instituteId, driverId, helperId });

    const route = await TransportRoute.create({
      instituteId,
      routeName: routeName.trim(),
      routeCode: routeCode.trim().toUpperCase(),
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      helperId: helperId || null,
      startPoint: startPoint.trim(),
      endPoint: endPoint.trim(),
      stops: normalizedStops,
      monthlyFee: Number(monthlyFee || 0),
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "transport_route",
      entityId: route._id,
      message: "Transport route created",
    });

    res.status(201).json({
      message: "Route created successfully",
      route: await populateTransportRoute(route._id),
    });
  } catch (error) {
    next(error);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    const query = buildRouteQuery(req);
    if (req.user?.role === "staff" && req.user.designation === "driver") {
      query.driverId = req.user._id;
    }

    const routes = await TransportRoute.find(query).populate(routePopulate).sort({ createdAt: -1 });
    const search = req.query.search?.trim().toLowerCase();
    const filteredRoutes = !search
      ? routes
      : routes.filter(
          (route) =>
            route.routeName.toLowerCase().includes(search) ||
            route.routeCode.toLowerCase().includes(search) ||
            route.startPoint.toLowerCase().includes(search) ||
            route.endPoint.toLowerCase().includes(search)
        );

    res.json({
      routes: filteredRoutes.map((route) => ({
        ...sanitizeTransportRoute(route),
        vehicle: route.vehicleId,
        driver: route.driverId,
        helper: route.helperId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({ _id: req.params.id, isDeleted: false }).populate(routePopulate);
    if (!route) {
      res.status(404);
      throw new Error("Route not found");
    }

    if (!ensureInstituteScope(req, route.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this route");
    }

    if (req.user?.role === "staff" && req.user.designation === "driver" && String(route.driverId?._id || route.driverId) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Driver can only view the assigned route");
    }

    res.json({
      route: {
        ...sanitizeTransportRoute(route),
        vehicle: route.vehicleId,
        driver: route.driverId,
        helper: route.helperId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({ _id: req.params.id, isDeleted: false });
    if (!route) {
      res.status(404);
      throw new Error("Route not found");
    }

    if (!ensureInstituteScope(req, route.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this route");
    }

    if (req.body.routeCode?.trim() && req.body.routeCode.trim().toUpperCase() !== route.routeCode) {
      const duplicateRoute = await TransportRoute.findOne({
        instituteId: route.instituteId,
        routeCode: req.body.routeCode.trim().toUpperCase(),
        isDeleted: false,
        _id: { $ne: route._id },
      });
      if (duplicateRoute) {
        res.status(409);
        throw new Error("Route code already exists for this institute");
      }
    }

    if (req.body.vehicleId) {
      const vehicle = await TransportVehicle.findOne({
        _id: req.body.vehicleId,
        instituteId: route.instituteId,
        isDeleted: false,
      });
      if (!vehicle) {
        res.status(400);
        throw new Error("Vehicle not found for this institute");
      }
    }

    await validateRouteStaff({
      instituteId: route.instituteId,
      driverId: req.body.driverId ?? route.driverId,
      helperId: req.body.helperId ?? route.helperId,
    });

    const normalizedStops = req.body.stops ? normalizeStops(req.body.stops) : route.stops;
    const stopError = validateStopList(normalizedStops);
    if (stopError) {
      res.status(400);
      throw new Error(stopError);
    }

    Object.assign(route, {
      routeName: req.body.routeName?.trim() ?? route.routeName,
      routeCode: req.body.routeCode?.trim().toUpperCase() ?? route.routeCode,
      vehicleId: req.body.vehicleId !== undefined ? req.body.vehicleId || null : route.vehicleId,
      driverId: req.body.driverId !== undefined ? req.body.driverId || null : route.driverId,
      helperId: req.body.helperId !== undefined ? req.body.helperId || null : route.helperId,
      startPoint: req.body.startPoint?.trim() ?? route.startPoint,
      endPoint: req.body.endPoint?.trim() ?? route.endPoint,
      stops: normalizedStops,
      monthlyFee: req.body.monthlyFee !== undefined ? Number(req.body.monthlyFee || 0) : route.monthlyFee,
      status: req.body.status ?? route.status,
      updatedBy: req.user._id,
    });

    await route.save();

    await createAuditLog({
      req,
      instituteId: route.instituteId,
      action: "update",
      entity: "transport_route",
      entityId: route._id,
      message: "Transport route updated",
    });

    res.json({
      message: "Route updated successfully",
      route: await populateTransportRoute(route._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateRouteStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const route = await TransportRoute.findOne({ _id: req.params.id, isDeleted: false });
    if (!route) {
      res.status(404);
      throw new Error("Route not found");
    }

    if (!ensureInstituteScope(req, route.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this route");
    }

    route.status = status;
    route.updatedBy = req.user._id;
    await route.save();

    await createAuditLog({
      req,
      instituteId: route.instituteId,
      action: "status_update",
      entity: "transport_route",
      entityId: route._id,
      message: `Transport route marked ${status}`,
    });

    res.json({
      message: "Route status updated successfully",
      route: await populateTransportRoute(route._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({ _id: req.params.id, isDeleted: false });
    if (!route) {
      res.status(404);
      throw new Error("Route not found");
    }

    if (!ensureInstituteScope(req, route.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this route");
    }

    route.isDeleted = true;
    route.deletedAt = new Date();
    route.status = "inactive";
    route.updatedBy = req.user._id;
    await route.save();

    await createAuditLog({
      req,
      instituteId: route.instituteId,
      action: "soft_delete",
      entity: "transport_route",
      entityId: route._id,
      message: "Transport route deleted",
    });

    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createAllocation = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const { studentId, routeId, stopName, pickupTime, dropTime, monthlyFee, startDate, endDate, status = "active" } =
      req.body;

    if (!studentId || !routeId || !stopName?.trim() || !startDate) {
      res.status(400);
      throw new Error("Student, route, stop name, and start date are required");
    }

    const student = await Student.findOne({ _id: studentId, instituteId, isDeleted: false });
    if (!student) {
      res.status(400);
      throw new Error("Student not found for this institute");
    }

    const route = await TransportRoute.findOne({ _id: routeId, instituteId, isDeleted: false }).populate("vehicleId", "capacity");
    if (!route) {
      res.status(400);
      throw new Error("Route not found for this institute");
    }

    const duplicateAllocation = await TransportAllocation.findOne({
      instituteId,
      studentId,
      isDeleted: false,
      status: "active",
    });
    if (duplicateAllocation) {
      res.status(409);
      throw new Error("Student already has an active transport allocation");
    }

    if (status === "active") {
      await ensureRouteCapacity(routeId);
    }

    const stop = resolveRouteStop(route, stopName);
    const allocation = await TransportAllocation.create({
      instituteId,
      studentId,
      routeId,
      stopName: stop.stopName,
      pickupTime: pickupTime?.trim() || stop.pickupTime || "",
      dropTime: dropTime?.trim() || stop.dropTime || "",
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee || 0) : Number(route.monthlyFee || 0),
      startDate,
      endDate: endDate || null,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "transport_allocation",
      entityId: allocation._id,
      message: "Transport allocation created",
    });

    res.status(201).json({
      message: "Transport allocation created successfully",
      allocation: await populateTransportAllocation(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const allocations = await TransportAllocation.find(buildAllocationQuery(req))
      .populate(allocationPopulate)
      .sort({ createdAt: -1 });

    const search = req.query.search?.trim().toLowerCase();
    const filteredAllocations = !search
      ? allocations
      : allocations.filter((allocation) => {
          const studentName = allocation.studentId?.userId?.name?.toLowerCase() || "";
          const routeName = allocation.routeId?.routeName?.toLowerCase() || "";
          return (
            studentName.includes(search) ||
            routeName.includes(search) ||
            allocation.stopName.toLowerCase().includes(search)
          );
        });

    res.json({
      allocations: filteredAllocations.map((allocation) => ({
        ...sanitizeTransportAllocation(allocation),
        student: allocation.studentId,
        route: allocation.routeId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getAllocationById = async (req, res, next) => {
  try {
    const allocation = await TransportAllocation.findOne({ _id: req.params.id, isDeleted: false }).populate(
      allocationPopulate
    );
    if (!allocation) {
      res.status(404);
      throw new Error("Transport allocation not found");
    }

    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this transport allocation");
    }

    res.json({
      allocation: {
        ...sanitizeTransportAllocation(allocation),
        student: allocation.studentId,
        route: allocation.routeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateAllocation = async (req, res, next) => {
  try {
    const allocation = await TransportAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Transport allocation not found");
    }

    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this transport allocation");
    }

    const studentId = req.body.studentId || allocation.studentId;
    const routeId = req.body.routeId || allocation.routeId;
    const status = req.body.status || allocation.status;

    const student = await Student.findOne({
      _id: studentId,
      instituteId: allocation.instituteId,
      isDeleted: false,
    });
    if (!student) {
      res.status(400);
      throw new Error("Student not found for this institute");
    }

    const route = await TransportRoute.findOne({
      _id: routeId,
      instituteId: allocation.instituteId,
      isDeleted: false,
    }).populate("vehicleId", "capacity");
    if (!route) {
      res.status(400);
      throw new Error("Route not found for this institute");
    }

    const duplicateAllocation = await TransportAllocation.findOne({
      instituteId: allocation.instituteId,
      studentId,
      status: "active",
      isDeleted: false,
      _id: { $ne: allocation._id },
    });
    if (duplicateAllocation && status === "active") {
      res.status(409);
      throw new Error("Student already has another active transport allocation");
    }

    if (status === "active") {
      await ensureRouteCapacity(routeId, allocation._id);
    }

    const stop = resolveRouteStop(route, req.body.stopName || allocation.stopName);
    Object.assign(allocation, {
      studentId,
      routeId,
      stopName: stop.stopName,
      pickupTime: req.body.pickupTime !== undefined ? req.body.pickupTime?.trim() || stop.pickupTime || "" : allocation.pickupTime,
      dropTime: req.body.dropTime !== undefined ? req.body.dropTime?.trim() || stop.dropTime || "" : allocation.dropTime,
      monthlyFee: req.body.monthlyFee !== undefined ? Number(req.body.monthlyFee || 0) : allocation.monthlyFee,
      startDate: req.body.startDate || allocation.startDate,
      endDate: req.body.endDate !== undefined ? req.body.endDate || null : allocation.endDate,
      status,
      updatedBy: req.user._id,
    });

    await allocation.save();

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "update",
      entity: "transport_allocation",
      entityId: allocation._id,
      message: "Transport allocation updated",
    });

    res.json({
      message: "Transport allocation updated successfully",
      allocation: await populateTransportAllocation(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateAllocationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const allocation = await TransportAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Transport allocation not found");
    }

    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this transport allocation");
    }

    if (status === "active") {
      await ensureRouteCapacity(allocation.routeId, allocation._id);
    }

    allocation.status = status;
    allocation.updatedBy = req.user._id;
    await allocation.save();

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "status_update",
      entity: "transport_allocation",
      entityId: allocation._id,
      message: `Transport allocation marked ${status}`,
    });

    res.json({
      message: "Transport allocation status updated successfully",
      allocation: await populateTransportAllocation(allocation._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAllocation = async (req, res, next) => {
  try {
    const allocation = await TransportAllocation.findOne({ _id: req.params.id, isDeleted: false });
    if (!allocation) {
      res.status(404);
      throw new Error("Transport allocation not found");
    }

    if (!ensureInstituteScope(req, allocation.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this transport allocation");
    }

    allocation.isDeleted = true;
    allocation.deletedAt = new Date();
    allocation.status = "inactive";
    allocation.updatedBy = req.user._id;
    await allocation.save();

    await createAuditLog({
      req,
      instituteId: allocation.instituteId,
      action: "soft_delete",
      entity: "transport_allocation",
      entityId: allocation._id,
      message: "Transport allocation deleted",
    });

    res.json({ message: "Transport allocation deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getMyTransport = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const allocation = await TransportAllocation.findOne({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
      status: "active",
    }).populate(allocationPopulate);

    res.json({
      allocation: allocation
        ? {
            ...sanitizeTransportAllocation(allocation),
            student: allocation.studentId,
            route: allocation.routeId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getChildTransport = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const allocation = await TransportAllocation.findOne({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
      status: "active",
    }).populate(allocationPopulate);

    res.json({
      allocation: allocation
        ? {
            ...sanitizeTransportAllocation(allocation),
            student: allocation.studentId,
            route: allocation.routeId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getAllocationsByStudentId = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    if (!ensureInstituteScope(req, student.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const allocations = await TransportAllocation.find({
      studentId: student._id,
      instituteId: student.instituteId,
      isDeleted: false,
    })
      .populate(allocationPopulate)
      .sort({ createdAt: -1 });

    res.json({
      allocations: allocations.map((allocation) => ({
        ...sanitizeTransportAllocation(allocation),
        student: allocation.studentId,
        route: allocation.routeId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getDriverMyRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({
      instituteId: getScopedInstituteId(req, true),
      driverId: req.user._id,
      isDeleted: false,
      status: "active",
    }).populate(routePopulate);

    res.json({
      route: route
        ? {
            ...sanitizeTransportRoute(route),
            vehicle: route.vehicleId,
            driver: route.driverId,
            helper: route.helperId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getDriverMyStudents = async (req, res, next) => {
  try {
    const route = await TransportRoute.findOne({
      instituteId: getScopedInstituteId(req, true),
      driverId: req.user._id,
      isDeleted: false,
      status: "active",
    });

    if (!route) {
      return res.json({ students: [] });
    }

    const allocations = await TransportAllocation.find({
      instituteId: route.instituteId,
      routeId: route._id,
      isDeleted: false,
      status: "active",
    })
      .populate(allocationPopulate)
      .sort({ stopName: 1, createdAt: 1 });

    res.json({
      route: await populateTransportRoute(route._id),
      students: allocations.map((allocation) => ({
        ...sanitizeTransportAllocation(allocation),
        student: allocation.studentId,
        route: allocation.routeId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  updateRouteStatus,
  deleteRoute,
  createAllocation,
  getAllocations,
  getMyTransport,
  getChildTransport,
  getAllocationsByStudentId,
  getAllocationById,
  updateAllocation,
  updateAllocationStatus,
  deleteAllocation,
  getDriverMyRoute,
  getDriverMyStudents,
  getSupportData,
};
