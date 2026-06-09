const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const periodTypeOptions = ["theory", "practical", "lab", "tutorial", "break", "activity"];
const timetableStatusOptions = ["active", "inactive"];

const timetableFormDefaults = {
  academicGroupId: "",
  dayOfWeek: "monday",
  status: "active",
  periods: [
    {
      periodNumber: 1,
      subjectId: "",
      teacherId: "",
      startTime: "09:00",
      endTime: "10:00",
      roomNumber: "",
      type: "theory",
    },
  ],
};

export { dayOptions, periodTypeOptions, timetableStatusOptions, timetableFormDefaults };
