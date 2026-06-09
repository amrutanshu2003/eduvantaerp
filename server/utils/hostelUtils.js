const sanitizeHostel = (hostel) => ({
  _id: hostel._id,
  instituteId: hostel.instituteId,
  hostelName: hostel.hostelName,
  hostelCode: hostel.hostelCode,
  hostelType: hostel.hostelType,
  totalFloors: hostel.totalFloors,
  address: hostel.address,
  wardenId: hostel.wardenId,
  contactNumber: hostel.contactNumber,
  status: hostel.status,
  createdBy: hostel.createdBy,
  updatedBy: hostel.updatedBy,
  createdAt: hostel.createdAt,
  updatedAt: hostel.updatedAt,
});

const sanitizeHostelRoom = (room) => ({
  _id: room._id,
  instituteId: room.instituteId,
  hostelId: room.hostelId,
  roomNumber: room.roomNumber,
  floorNumber: room.floorNumber,
  roomType: room.roomType,
  capacity: room.capacity,
  occupiedBeds: room.occupiedBeds,
  status: room.status,
  createdBy: room.createdBy,
  updatedBy: room.updatedBy,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const sanitizeHostelBed = (bed) => ({
  _id: bed._id,
  instituteId: bed.instituteId,
  hostelId: bed.hostelId,
  roomId: bed.roomId,
  bedNumber: bed.bedNumber,
  status: bed.status,
  allocatedStudentId: bed.allocatedStudentId,
  createdBy: bed.createdBy,
  updatedBy: bed.updatedBy,
  createdAt: bed.createdAt,
  updatedAt: bed.updatedAt,
});

export { sanitizeHostel, sanitizeHostelRoom, sanitizeHostelBed };
