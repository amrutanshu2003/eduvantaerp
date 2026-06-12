import Hostel from "../models/Hostel.js";
import HostelBed from "../models/HostelBed.js";
import HostelRoom from "../models/HostelRoom.js";
import Student from "../models/Student.js";
import StaffMember from "../models/StaffMember.js";
import createAuditLog from "../utils/audit.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { sanitizeHostel, sanitizeHostelBed, sanitizeHostelRoom } from "../utils/hostelUtils.js";
import { getUserModelName } from "../utils/userModel.js";

const hostelPopulate = [
  { path: "wardenId", select: "name email phone designation staffId status" },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const roomPopulate = [
  { path: "hostelId", populate: hostelPopulate },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const bedPopulate = [
  { path: "hostelId", populate: hostelPopulate },
  { path: "roomId", populate: roomPopulate },
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const populateHostel = async (hostelId) => {
  const hostel = await Hostel.findById(hostelId).populate(hostelPopulate);
  return hostel ? { ...sanitizeHostel(hostel), warden: hostel.wardenId } : null;
};

const populateRoom = async (roomId) => {
  const room = await HostelRoom.findById(roomId).populate(roomPopulate);
  return room ? { ...sanitizeHostelRoom(room), hostel: room.hostelId } : null;
};

const populateBed = async (bedId) => {
  const bed = await HostelBed.findById(bedId).populate(bedPopulate);
  return bed ? { ...sanitizeHostelBed(bed), hostel: bed.hostelId, room: bed.roomId } : null;
};

const getWardenById = async (wardenId, instituteId) => {
  if (!wardenId) {
    return null;
  }

  const warden = await StaffMember.findOne({
    _id: wardenId,
    instituteId,
    isDeleted: false,
  }).select("-password");

  if (!warden) {
    throw new Error("Warden not found for this institute");
  }

  if (warden.designation !== "hostel_warden") {
    throw new Error("Selected user must have hostel_warden designation");
  }

  return warden;
};

const syncRoomOccupancy = async (roomId) => {
  const room = await HostelRoom.findById(roomId);
  if (!room || room.isDeleted) {
    return;
  }

  const occupiedBeds = await HostelBed.countDocuments({
    roomId: room._id,
    isDeleted: false,
    status: "occupied",
  });

  room.occupiedBeds = occupiedBeds;
  if (!["maintenance", "inactive"].includes(room.status)) {
    room.status = occupiedBeds >= room.capacity ? "full" : "available";
  }

  await room.save();
};

const buildHostelQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.hostelType && req.query.hostelType !== "all") {
    query.hostelType = req.query.hostelType;
  }

  return query;
};

const buildRoomQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.params.hostelId) {
    query.hostelId = req.params.hostelId;
  }

  if (req.query.hostelId && req.query.hostelId !== "all") {
    query.hostelId = req.query.hostelId;
  }

  if (req.query.floorNumber && req.query.floorNumber !== "all") {
    query.floorNumber = Number(req.query.floorNumber);
  }

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  return query;
};

const buildBedQuery = (req) => {
  const query = {
    instituteId: getScopedInstituteId(req, true),
    isDeleted: false,
  };

  if (req.params.roomId) {
    query.roomId = req.params.roomId;
  }

  if (req.query.hostelId && req.query.hostelId !== "all") {
    query.hostelId = req.query.hostelId;
  }

  if (req.query.roomId && req.query.roomId !== "all") {
    query.roomId = req.query.roomId;
  }

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  return query;
};

const getSupportData = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const [hostels, rooms, beds, students, staff] = await Promise.all([
      Hostel.find({ instituteId, isDeleted: false }).sort({ hostelName: 1 }),
      HostelRoom.find({ instituteId, isDeleted: false }).sort({ createdAt: -1 }),
      HostelBed.find({ instituteId, isDeleted: false }).sort({ createdAt: -1 }),
      Student.find({ instituteId, isDeleted: false, status: "active" })
        .populate("academicGroupId", "className section department course semester year batch")
        .sort({ createdAt: -1 }),
      StaffMember.find({
        instituteId,
        isDeleted: false,
        status: "active",
        designation: { $in: ["hostel_warden", "hostel_security"] },
      })
        .select("-password")
        .sort({ name: 1 }),
    ]);

    res.json({ hostels, rooms, beds, students, staff });
  } catch (error) {
    next(error);
  }
};

const createHostel = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const actorModel = getUserModelName(req.user?.role);
    const {
      hostelName,
      hostelCode,
      hostelType,
      totalFloors,
      address,
      wardenId,
      contactNumber,
      status = "active",
    } = req.body;

    if (!hostelName?.trim() || !hostelCode?.trim() || !hostelType || !totalFloors) {
      res.status(400);
      throw new Error("Hostel name, hostel code, hostel type, and total floors are required");
    }

    const duplicateHostel = await Hostel.findOne({
      instituteId,
      hostelCode: hostelCode.trim().toUpperCase(),
      isDeleted: false,
    });
    if (duplicateHostel) {
      res.status(409);
      throw new Error("Hostel code already exists for this institute");
    }

    await getWardenById(wardenId, instituteId);

    const hostel = await Hostel.create({
      instituteId,
      hostelName: hostelName.trim(),
      hostelCode: hostelCode.trim().toUpperCase(),
      hostelType,
      totalFloors: Number(totalFloors),
      address: address?.trim() || "",
      wardenId: wardenId || null,
      contactNumber: contactNumber?.trim() || "",
      status,
      createdBy: req.user._id,
      createdByModel: actorModel,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "hostel",
      entityId: hostel._id,
      message: "Hostel created",
    });

    res.status(201).json({
      message: "Hostel created successfully",
      hostel: await populateHostel(hostel._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find(buildHostelQuery(req)).populate(hostelPopulate).sort({ createdAt: -1 });
    const search = req.query.search?.trim().toLowerCase();
    const filteredHostels = !search
      ? hostels
      : hostels.filter(
          (hostel) =>
            hostel.hostelName.toLowerCase().includes(search) ||
            hostel.hostelCode.toLowerCase().includes(search) ||
            hostel.wardenId?.name?.toLowerCase().includes(search)
        );

    res.json({
      hostels: filteredHostels.map((hostel) => ({
        ...sanitizeHostel(hostel),
        warden: hostel.wardenId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelById = async (req, res, next) => {
  try {
    const hostel = await Hostel.findOne({ _id: req.params.id, isDeleted: false }).populate(hostelPopulate);
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (!ensureInstituteScope(req, hostel.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel");
    }

    res.json({
      hostel: {
        ...sanitizeHostel(hostel),
        warden: hostel.wardenId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateHostel = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const hostel = await Hostel.findOne({ _id: req.params.id, isDeleted: false });
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (!ensureInstituteScope(req, hostel.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel");
    }

    if (req.body.hostelCode?.trim() && req.body.hostelCode.trim().toUpperCase() !== hostel.hostelCode) {
      const duplicateHostel = await Hostel.findOne({
        instituteId: hostel.instituteId,
        hostelCode: req.body.hostelCode.trim().toUpperCase(),
        isDeleted: false,
        _id: { $ne: hostel._id },
      });
      if (duplicateHostel) {
        res.status(409);
        throw new Error("Hostel code already exists for this institute");
      }
    }

    await getWardenById(req.body.wardenId ?? hostel.wardenId, hostel.instituteId);

    Object.assign(hostel, {
      hostelName: req.body.hostelName?.trim() ?? hostel.hostelName,
      hostelCode: req.body.hostelCode?.trim().toUpperCase() ?? hostel.hostelCode,
      hostelType: req.body.hostelType ?? hostel.hostelType,
      totalFloors: req.body.totalFloors ? Number(req.body.totalFloors) : hostel.totalFloors,
      address: req.body.address?.trim() ?? hostel.address,
      wardenId: req.body.wardenId !== undefined ? req.body.wardenId || null : hostel.wardenId,
      contactNumber: req.body.contactNumber?.trim() ?? hostel.contactNumber,
      status: req.body.status ?? hostel.status,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await hostel.save();

    await createAuditLog({
      req,
      instituteId: hostel.instituteId,
      action: "update",
      entity: "hostel",
      entityId: hostel._id,
      message: "Hostel updated",
    });

    res.json({
      message: "Hostel updated successfully",
      hostel: await populateHostel(hostel._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelStatus = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const { status } = req.body;
    if (!["active", "inactive", "maintenance"].includes(status)) {
      res.status(400);
      throw new Error("Status must be active, inactive, or maintenance");
    }

    const hostel = await Hostel.findOne({ _id: req.params.id, isDeleted: false });
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (!ensureInstituteScope(req, hostel.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel");
    }

    hostel.status = status;
    hostel.updatedBy = req.user._id;
    hostel.updatedByModel = actorModel;
    await hostel.save();

    await createAuditLog({
      req,
      instituteId: hostel.instituteId,
      action: "status_update",
      entity: "hostel",
      entityId: hostel._id,
      message: `Hostel marked ${status}`,
    });

    res.json({
      message: "Hostel status updated successfully",
      hostel: await populateHostel(hostel._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostel = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const hostel = await Hostel.findOne({ _id: req.params.id, isDeleted: false });
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (!ensureInstituteScope(req, hostel.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel");
    }

    hostel.isDeleted = true;
    hostel.deletedAt = new Date();
    hostel.status = "inactive";
    hostel.updatedBy = req.user._id;
    hostel.updatedByModel = actorModel;
    await hostel.save();
    await HostelRoom.updateMany(
      { hostelId: hostel._id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: "inactive",
        updatedBy: req.user._id,
        updatedByModel: actorModel,
      }
    );
    await HostelBed.updateMany(
      { hostelId: hostel._id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: "inactive",
        allocatedStudentId: null,
        updatedBy: req.user._id,
        updatedByModel: actorModel,
      }
    );

    await createAuditLog({
      req,
      instituteId: hostel.instituteId,
      action: "soft_delete",
      entity: "hostel",
      entityId: hostel._id,
      message: "Hostel deleted",
    });

    res.json({ message: "Hostel deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const actorModel = getUserModelName(req.user?.role);
    const hostel = await Hostel.findOne({ _id: req.params.hostelId, instituteId, isDeleted: false });
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    const {
      roomNumber,
      floorNumber,
      roomType = "single",
      capacity,
      status = "available",
    } = req.body;

    if (!roomNumber?.trim() || floorNumber === undefined || !capacity) {
      res.status(400);
      throw new Error("Room number, floor number, and capacity are required");
    }

    const duplicateRoom = await HostelRoom.findOne({
      hostelId: hostel._id,
      roomNumber: roomNumber.trim(),
      isDeleted: false,
    });
    if (duplicateRoom) {
      res.status(409);
      throw new Error("Room number already exists in this hostel");
    }

    const room = await HostelRoom.create({
      instituteId,
      hostelId: hostel._id,
      roomNumber: roomNumber.trim().toUpperCase(),
      floorNumber: Number(floorNumber),
      roomType,
      capacity: Number(capacity),
      occupiedBeds: 0,
      status,
      createdBy: req.user._id,
      createdByModel: actorModel,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "hostel_room",
      entityId: room._id,
      message: "Hostel room created",
    });

    res.status(201).json({
      message: "Hostel room created successfully",
      room: await populateRoom(room._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelRooms = async (req, res, next) => {
  try {
    const rooms = await HostelRoom.find(buildRoomQuery(req)).populate(roomPopulate).sort({ createdAt: -1 });
    const search = req.query.search?.trim().toLowerCase();
    const filteredRooms = !search
      ? rooms
      : rooms.filter(
          (room) =>
            room.roomNumber.toLowerCase().includes(search) ||
            room.hostelId?.hostelName?.toLowerCase().includes(search)
        );

    res.json({
      rooms: filteredRooms.map((room) => ({
        ...sanitizeHostelRoom(room),
        hostel: room.hostelId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelRoomById = async (req, res, next) => {
  try {
    const room = await HostelRoom.findOne({ _id: req.params.id, isDeleted: false }).populate(roomPopulate);
    if (!room) {
      res.status(404);
      throw new Error("Hostel room not found");
    }

    if (!ensureInstituteScope(req, room.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel room");
    }

    res.json({
      room: {
        ...sanitizeHostelRoom(room),
        hostel: room.hostelId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelRoom = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const room = await HostelRoom.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      res.status(404);
      throw new Error("Hostel room not found");
    }

    if (!ensureInstituteScope(req, room.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel room");
    }

    if (req.body.roomNumber?.trim() && req.body.roomNumber.trim().toUpperCase() !== room.roomNumber) {
      const duplicateRoom = await HostelRoom.findOne({
        hostelId: room.hostelId,
        roomNumber: req.body.roomNumber.trim().toUpperCase(),
        isDeleted: false,
        _id: { $ne: room._id },
      });
      if (duplicateRoom) {
        res.status(409);
        throw new Error("Room number already exists in this hostel");
      }
    }

    const totalBeds = await HostelBed.countDocuments({ roomId: room._id, isDeleted: false });
    const nextCapacity = req.body.capacity ? Number(req.body.capacity) : room.capacity;
    if (nextCapacity < totalBeds) {
      res.status(400);
      throw new Error("Room capacity cannot be less than existing bed count");
    }

    Object.assign(room, {
      roomNumber: req.body.roomNumber?.trim().toUpperCase() ?? room.roomNumber,
      floorNumber: req.body.floorNumber !== undefined ? Number(req.body.floorNumber) : room.floorNumber,
      roomType: req.body.roomType ?? room.roomType,
      capacity: nextCapacity,
      status: req.body.status ?? room.status,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await room.save();
    await syncRoomOccupancy(room._id);

    await createAuditLog({
      req,
      instituteId: room.instituteId,
      action: "update",
      entity: "hostel_room",
      entityId: room._id,
      message: "Hostel room updated",
    });

    res.json({
      message: "Hostel room updated successfully",
      room: await populateRoom(room._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelRoomStatus = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const { status } = req.body;
    if (!["available", "full", "maintenance", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be available, full, maintenance, or inactive");
    }

    const room = await HostelRoom.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      res.status(404);
      throw new Error("Hostel room not found");
    }

    if (!ensureInstituteScope(req, room.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel room");
    }

    room.status = status;
    room.updatedBy = req.user._id;
    room.updatedByModel = actorModel;
    await room.save();

    if (status === "available" || status === "full") {
      await syncRoomOccupancy(room._id);
    }

    await createAuditLog({
      req,
      instituteId: room.instituteId,
      action: "status_update",
      entity: "hostel_room",
      entityId: room._id,
      message: `Hostel room marked ${status}`,
    });

    res.json({
      message: "Hostel room status updated successfully",
      room: await populateRoom(room._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostelRoom = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const room = await HostelRoom.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      res.status(404);
      throw new Error("Hostel room not found");
    }

    if (!ensureInstituteScope(req, room.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel room");
    }

    room.isDeleted = true;
    room.deletedAt = new Date();
    room.status = "inactive";
    room.updatedBy = req.user._id;
    room.updatedByModel = actorModel;
    await room.save();
    await HostelBed.updateMany(
      { roomId: room._id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: "inactive",
        allocatedStudentId: null,
        updatedBy: req.user._id,
        updatedByModel: actorModel,
      }
    );

    await createAuditLog({
      req,
      instituteId: room.instituteId,
      action: "soft_delete",
      entity: "hostel_room",
      entityId: room._id,
      message: "Hostel room deleted",
    });

    res.json({ message: "Hostel room deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createBed = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, true);
    const actorModel = getUserModelName(req.user?.role);
    const room = await HostelRoom.findOne({ _id: req.params.roomId, instituteId, isDeleted: false });
    if (!room) {
      res.status(404);
      throw new Error("Hostel room not found");
    }

    const hostel = await Hostel.findOne({ _id: room.hostelId, instituteId, isDeleted: false });
    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    const { bedNumber, status = "available" } = req.body;
    if (!bedNumber?.trim()) {
      res.status(400);
      throw new Error("Bed number is required");
    }

    const totalBeds = await HostelBed.countDocuments({ roomId: room._id, isDeleted: false });
    if (totalBeds >= room.capacity) {
      res.status(400);
      throw new Error("Room capacity reached. Cannot add more beds");
    }

    if (status === "occupied") {
      res.status(400);
      throw new Error("Bed cannot be marked occupied without allocation");
    }

    const duplicateBed = await HostelBed.findOne({
      roomId: room._id,
      bedNumber: bedNumber.trim().toUpperCase(),
      isDeleted: false,
    });
    if (duplicateBed) {
      res.status(409);
      throw new Error("Bed number already exists in this room");
    }

    const bed = await HostelBed.create({
      instituteId,
      hostelId: hostel._id,
      roomId: room._id,
      bedNumber: bedNumber.trim().toUpperCase(),
      status,
      createdBy: req.user._id,
      createdByModel: actorModel,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await syncRoomOccupancy(room._id);

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "hostel_bed",
      entityId: bed._id,
      message: "Hostel bed created",
    });

    res.status(201).json({
      message: "Hostel bed created successfully",
      bed: await populateBed(bed._id),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelBeds = async (req, res, next) => {
  try {
    const beds = await HostelBed.find(buildBedQuery(req)).populate(bedPopulate).sort({ createdAt: -1 });
    const search = req.query.search?.trim().toLowerCase();
    const filteredBeds = !search
      ? beds
      : beds.filter(
          (bed) =>
            bed.bedNumber.toLowerCase().includes(search) ||
            bed.roomId?.roomNumber?.toLowerCase().includes(search) ||
            bed.hostelId?.hostelName?.toLowerCase().includes(search)
        );

    res.json({
      beds: filteredBeds.map((bed) => ({
        ...sanitizeHostelBed(bed),
        hostel: bed.hostelId,
        room: bed.roomId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getHostelBedById = async (req, res, next) => {
  try {
    const bed = await HostelBed.findOne({ _id: req.params.id, isDeleted: false }).populate(bedPopulate);
    if (!bed) {
      res.status(404);
      throw new Error("Hostel bed not found");
    }

    if (!ensureInstituteScope(req, bed.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel bed");
    }

    res.json({
      bed: {
        ...sanitizeHostelBed(bed),
        hostel: bed.hostelId,
        room: bed.roomId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelBed = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const bed = await HostelBed.findOne({ _id: req.params.id, isDeleted: false });
    if (!bed) {
      res.status(404);
      throw new Error("Hostel bed not found");
    }

    if (!ensureInstituteScope(req, bed.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel bed");
    }

    const nextStatus = req.body.status ?? bed.status;
    const nextAllocatedStudentId =
      req.body.allocatedStudentId !== undefined ? req.body.allocatedStudentId || null : bed.allocatedStudentId;

    if (req.body.bedNumber?.trim() && req.body.bedNumber.trim().toUpperCase() !== bed.bedNumber) {
      const duplicateBed = await HostelBed.findOne({
        roomId: bed.roomId,
        bedNumber: req.body.bedNumber.trim().toUpperCase(),
        isDeleted: false,
        _id: { $ne: bed._id },
      });
      if (duplicateBed) {
        res.status(409);
        throw new Error("Bed number already exists in this room");
      }
    }

    if (nextStatus === "occupied" && !nextAllocatedStudentId) {
      res.status(400);
      throw new Error("Occupied bed must have an allocated student");
    }

    if (nextStatus !== "occupied" && nextAllocatedStudentId) {
      res.status(400);
      throw new Error("Allocated student is only allowed for occupied beds");
    }

    Object.assign(bed, {
      bedNumber: req.body.bedNumber?.trim().toUpperCase() ?? bed.bedNumber,
      status: nextStatus,
      allocatedStudentId: nextAllocatedStudentId,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await bed.save();
    await syncRoomOccupancy(bed.roomId);

    await createAuditLog({
      req,
      instituteId: bed.instituteId,
      action: "update",
      entity: "hostel_bed",
      entityId: bed._id,
      message: "Hostel bed updated",
    });

    res.json({
      message: "Hostel bed updated successfully",
      bed: await populateBed(bed._id),
    });
  } catch (error) {
    next(error);
  }
};

const updateHostelBedStatus = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const { status } = req.body;
    if (!["available", "occupied", "maintenance", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Status must be available, occupied, maintenance, or inactive");
    }

    const bed = await HostelBed.findOne({ _id: req.params.id, isDeleted: false });
    if (!bed) {
      res.status(404);
      throw new Error("Hostel bed not found");
    }

    if (!ensureInstituteScope(req, bed.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel bed");
    }

    if (status === "occupied" && !bed.allocatedStudentId) {
      res.status(400);
      throw new Error("Bed cannot be marked occupied without allocation");
    }

    if (status !== "occupied" && bed.allocatedStudentId) {
      res.status(400);
      throw new Error("Allocated student must be removed before changing bed status");
    }

    bed.status = status;
    bed.updatedBy = req.user._id;
    bed.updatedByModel = actorModel;
    await bed.save();
    await syncRoomOccupancy(bed.roomId);

    await createAuditLog({
      req,
      instituteId: bed.instituteId,
      action: "status_update",
      entity: "hostel_bed",
      entityId: bed._id,
      message: `Hostel bed marked ${status}`,
    });

    res.json({
      message: "Hostel bed status updated successfully",
      bed: await populateBed(bed._id),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostelBed = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const bed = await HostelBed.findOne({ _id: req.params.id, isDeleted: false });
    if (!bed) {
      res.status(404);
      throw new Error("Hostel bed not found");
    }

    if (!ensureInstituteScope(req, bed.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this hostel bed");
    }

    bed.isDeleted = true;
    bed.deletedAt = new Date();
    bed.status = "inactive";
    bed.allocatedStudentId = null;
    bed.updatedBy = req.user._id;
    bed.updatedByModel = actorModel;
    await bed.save();
    await syncRoomOccupancy(bed.roomId);

    await createAuditLog({
      req,
      instituteId: bed.instituteId,
      action: "soft_delete",
      entity: "hostel_bed",
      entityId: bed._id,
      message: "Hostel bed deleted",
    });

    res.json({ message: "Hostel bed deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  updateHostelStatus,
  deleteHostel,
  createRoom,
  getHostelRooms,
  getHostelRoomById,
  updateHostelRoom,
  updateHostelRoomStatus,
  deleteHostelRoom,
  createBed,
  getHostelBeds,
  getHostelBedById,
  updateHostelBed,
  updateHostelBedStatus,
  deleteHostelBed,
  getSupportData,
};
