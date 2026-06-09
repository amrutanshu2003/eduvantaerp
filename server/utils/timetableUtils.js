const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || "")
    .split(":")
    .map((entry) => Number(entry));

  return hours * 60 + minutes;
};

const sanitizeTimetable = (timetable) => ({
  _id: timetable._id,
  instituteId: timetable.instituteId,
  academicGroupId: timetable.academicGroupId,
  dayOfWeek: timetable.dayOfWeek,
  periods: timetable.periods,
  status: timetable.status,
  createdBy: timetable.createdBy,
  updatedBy: timetable.updatedBy,
  createdAt: timetable.createdAt,
  updatedAt: timetable.updatedAt,
});

export { timeToMinutes, sanitizeTimetable };
