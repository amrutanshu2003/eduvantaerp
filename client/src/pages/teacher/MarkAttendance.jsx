import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import RoundTimePicker from "../../components/RoundTimePicker";
import { useUISettings } from "../../context/UISettingsContext";

const MarkAttendance = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    academicGroupId: "",
    subjectId: "",
    date: getTodayDateString(),
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    attendanceCount: 1,
    status: "submitted",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeError, setTimeError] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/academic-groups");
        setGroups(data.academicGroups);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load academic groups");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadStudentsAndSubjects = async () => {
      if (!formData.academicGroupId) {
        setStudents([]);
        setSubjects([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const [studentRes, subjectRes] = await Promise.all([
          api.get("/students", { params: { academicGroupId: formData.academicGroupId } }),
          api.get("/subjects", { params: { academicGroupId: formData.academicGroupId } })
        ]);
        const sortedStudents = (studentRes.data.students || []).sort((a, b) => {
          const rollA = a.rollNumber || '';
          const rollB = b.rollNumber || '';
          // Natural sort: extract numeric part for proper ordering
          const numA = parseInt(rollA.replace(/\D/g, '')) || 0;
          const numB = parseInt(rollB.replace(/\D/g, '')) || 0;
          if (numA !== numB) {
            return numA - numB;
          }
          // If numeric parts are equal, use locale compare with numeric option
          return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setStudents(sortedStudents);
        setSubjects(subjectRes.data.subjects || []);
        setRecords(sortedStudents.map((student) => ({ studentId: student._id, status: "present", remarks: "" })));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load students or subjects");
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudentsAndSubjects();
  }, [formData.academicGroupId]);

  const updateRecord = (studentId, key, value) => {
    setRecords((current) => current.map((record) => (record.studentId === studentId ? { ...record, [key]: value } : record)));
  };

  const markAllPresent = () => {
    setRecords((current) => current.map((record) => ({ ...record, status: "present" })));
  };

  const markAllAbsent = () => {
    setRecords((current) => current.map((record) => ({ ...record, status: "absent" })));
  };

  const resetAttendance = () => {
    setRecords((current) => current.map((record) => ({ ...record, status: "present", remarks: "" })));
  };

  const getAttendanceCounts = () => {
    const counts = { total: records.length, present: 0, absent: 0, late: 0, leave: 0 };
    records.forEach((record) => {
      if (record.status === "present") counts.present++;
      else if (record.status === "absent") counts.absent++;
      else if (record.status === "late") counts.late++;
      else if (record.status === "leave") counts.leave++;
    });
    return counts;
  };

  // Calculate attendance units based on attendanceCount
  const getAttendanceUnits = () => {
    const attendanceCount = formData.attendanceCount || 1;
    const counts = { total: records.length * attendanceCount, present: 0, absent: 0, late: 0, leave: 0 };
    records.forEach((record) => {
      if (record.status === "present") counts.present += attendanceCount;
      else if (record.status === "absent") counts.absent += attendanceCount;
      else if (record.status === "late") counts.late += attendanceCount;
      else if (record.status === "leave") counts.leave += attendanceCount;
    });
    return counts;
  };

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const record = records.find((r) => r.studentId === student._id);
      if (!record) return false;
      
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [students, records, searchQuery, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "absent": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "late": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "leave": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const parseTimeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
    if (period === "AM" && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  // Auto-calculate attendance count based on time difference
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const startMinutes = parseTimeToMinutes(formData.startTime);
      const endMinutes = parseTimeToMinutes(formData.endTime);
      const diffHours = Math.round((endMinutes - startMinutes) / 60);
      if (diffHours >= 1 && diffHours <= 8) {
        setFormData((current) => ({ ...current, attendanceCount: diffHours }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate end time > start time
    const startMinutes = parseTimeToMinutes(formData.startTime);
    const endMinutes = parseTimeToMinutes(formData.endTime);
    if (endMinutes <= startMinutes) {
      setTimeError("End time must be after start time.");
      return;
    }
    
    setTimeError("");
    setSubmitting(true);
    try {
      await api.post("/attendance", { ...formData, records });
      window.alert("Attendance submitted successfully");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading attendance form..." />;

  const counts = getAttendanceCounts();

  return (
    <section className="space-y-6 pb-36">
      <PageHeader eyebrow="Teacher" title="Mark Attendance" description="Select class, subject, date and attendance count to mark student attendance quickly." />

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white dark:bg-slate-800 p-6 shadow-card space-y-6 pb-36">
        
        {/* Row 1: Group, Subject, Date - Compact */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Academic Group</label>
            <select value={formData.academicGroupId} onChange={(event) => setFormData((current) => ({ ...current, academicGroupId: event.target.value, subjectId: "" }))} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm outline-none dark:text-white" required><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Subject (Optional)</label>
            <select value={formData.subjectId} onChange={(event) => setFormData((current) => ({ ...current, subjectId: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm outline-none dark:text-white" disabled={!formData.academicGroupId}><option value="">Select Subject</option>{subjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.subjectName} ({sub.subjectCode})</option>)}</select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Attendance Date</label>
            <input type="date" value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm outline-none dark:text-white" required />
          </div>
        </div>

        {/* Row 2: Class Start and End Times - Compact */}
        <div className="grid gap-3 md:grid-cols-3 border-t border-slate-100 dark:border-slate-700 pt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Class Start Time</label>
            <RoundTimePicker 
              value={formData.startTime} 
              onChange={(val) => {
                setFormData((current) => ({ ...current, startTime: val }));
                setTimeError("");
              }} 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Class End Time</label>
            <RoundTimePicker 
              value={formData.endTime} 
              onChange={(val) => {
                setFormData((current) => ({ ...current, endTime: val }));
                setTimeError("");
              }} 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Number of Attendance</label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.attendanceCount}
              onChange={(event) => setFormData((current) => ({ ...current, attendanceCount: parseInt(event.target.value) || 1 }))}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm outline-none dark:text-white"
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Use 1 for one period/hour, 2 for two periods/hours</p>
          </div>
        </div>
        {timeError && (
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">
            {timeError}
          </div>
        )}

        {/* Progress Indicator */}
        {students.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {records.length === students.length ? "All students marked" : `${records.filter(r => r.status !== "present" || r.remarks).length} of ${students.length} students reviewed`}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        {students.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 text-center border border-slate-200 dark:border-slate-600">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{counts.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Students</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center border border-emerald-200 dark:border-emerald-800">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{counts.present}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Present</p>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center border border-red-200 dark:border-red-800">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{counts.absent}</p>
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">Absent</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center border border-amber-200 dark:border-amber-800">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.late}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Late</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center border border-blue-200 dark:border-blue-800">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{counts.leave}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Leave</p>
              </div>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3 text-center border border-indigo-200 dark:border-indigo-800">
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{counts.total * (formData.attendanceCount || 1)}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Total Attendance Units</p>
            </div>
          </>
        )}

        {/* Search and Filter */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center border-t border-slate-100 dark:border-slate-700 pt-4">
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm outline-none dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm outline-none dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
            </select>
          </div>
        )}

        {/* Quick Action Buttons */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={markAllPresent} className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 text-sm font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-700">
              Mark All Present
            </button>
            <button type="button" onClick={markAllAbsent} className="rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-700">
              Mark All Absent
            </button>
            <button type="button" onClick={resetAttendance} className="rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600">
              Reset Attendance
            </button>
          </div>
        )}

        {/* Student List */}
        {loadingStudents ? (
          <div className="flex items-center justify-center py-12">
            <LoadingBlock message="Loading students..." />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-lg">No students found in this academic group.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add students to this academic group before marking attendance.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-lg">No students match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const record = records.find((r) => r.studentId === student._id) || { status: "present", remarks: "" };
              const statusBorderClass = {
                present: "border-emerald-300 dark:border-emerald-600",
                absent: "border-red-300 dark:border-red-600",
                late: "border-amber-300 dark:border-amber-600",
                leave: "border-blue-300 dark:border-blue-600"
              }[record.status] || "border-slate-200 dark:border-slate-600";
              
              return (
                <div 
                  key={student._id} 
                  className={`grid gap-3 rounded-xl border ${statusBorderClass} bg-white dark:bg-slate-700/50 p-4 md:grid-cols-[1.5fr_1.5fr_1fr] hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex flex-col justify-center">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Roll: {student.rollNumber}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { value: "present", label: "Present", colorClass: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/50" },
                      { value: "absent", label: "Absent", colorClass: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/50" },
                      { value: "late", label: "Late", colorClass: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/50" },
                      { value: "leave", label: "Leave", colorClass: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/50" }
                    ].map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => updateRecord(student._id, "status", status.value)}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          record.status === status.value 
                            ? status.colorClass + " ring-2 ring-offset-1 ring-slate-300 dark:ring-offset-slate-800 dark:ring-slate-500" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={record.remarks}
                    onChange={(event) => updateRecord(student._id, "remarks", event.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm outline-none dark:text-white focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-all"
                    placeholder="Remarks"
                  />
                </div>
              );
            })}
          </div>
        )}

        <AlertMessage tone="error" message={errorMessage} />
      </form>

      {/* Sticky Bottom Action Bar */}
      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-600 p-4 shadow-2xl z-[100]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Present Units: {counts.present * (formData.attendanceCount || 1)}</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">Absent Units: {counts.absent * (formData.attendanceCount || 1)}</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Late Units: {counts.late * (formData.attendanceCount || 1)}</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Leave Units: {counts.leave * (formData.attendanceCount || 1)}</span>
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Marked: {counts.total}/{students.length}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Attendance Count: {formData.attendanceCount || 1}</span>
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || loadingStudents}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow"
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MarkAttendance;
