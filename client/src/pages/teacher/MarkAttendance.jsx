import { useEffect, useState } from "react";
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
    status: "submitted",
  });
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
      try {
        const [studentRes, subjectRes] = await Promise.all([
          api.get("/students", { params: { academicGroupId: formData.academicGroupId } }),
          api.get("/subjects", { params: { academicGroupId: formData.academicGroupId } })
        ]);
        setStudents(studentRes.data.students || []);
        setSubjects(subjectRes.data.subjects || []);
        setRecords((studentRes.data.students || []).map((student) => ({ studentId: student._id, status: "present", remarks: "" })));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load students or subjects");
      }
    };
    loadStudentsAndSubjects();
  }, [formData.academicGroupId]);

  const updateRecord = (studentId, key, value) => {
    setRecords((current) => current.map((record) => (record.studentId === studentId ? { ...record, [key]: value } : record)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Mark Attendance" description="Select an academic group, subject, date, and class times to mark student attendance." />

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
        
        {/* Row 1: Group, Subject, Date */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 px-1">Academic Group</label>
            <select value={formData.academicGroupId} onChange={(event) => setFormData((current) => ({ ...current, academicGroupId: event.target.value, subjectId: "" }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 px-1">Subject (Optional)</label>
            <select value={formData.subjectId} onChange={(event) => setFormData((current) => ({ ...current, subjectId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" disabled={!formData.academicGroupId}><option value="">Select Subject</option>{subjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.subjectName} ({sub.subjectCode})</option>)}</select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 px-1">Attendance Date</label>
            <input type="date" value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required />
          </div>
        </div>

        {/* Row 2: Class Start and End Times */}
        <div className="grid gap-4 md:grid-cols-2 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 px-1">Class Start Time</label>
            <RoundTimePicker value={formData.startTime} onChange={(val) => setFormData((current) => ({ ...current, startTime: val }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 px-1">Class End Time</label>
            <RoundTimePicker value={formData.endTime} onChange={(val) => setFormData((current) => ({ ...current, endTime: val }))} />
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-4">{students.map((student) => <div key={student._id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.5fr_1fr_1fr]"><div><p className="font-medium text-ink">{student.user?.name}</p><p className="text-xs text-slate-500">{student.rollNumber}</p></div><select value={records.find((record) => record.studentId === student._id)?.status || "present"} onChange={(event) => updateRecord(student._id, "status", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="leave">Leave</option></select><input value={records.find((record) => record.studentId === student._id)?.remarks || ""} onChange={(event) => updateRecord(student._id, "remarks", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Remarks" /></div>)}</div>
        <div className="mt-6 space-y-4"><AlertMessage tone="error" message={errorMessage} /><button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Submitting..." : "Submit Attendance"}</button></div>
      </form>
    </section>
  );
};

export default MarkAttendance;
