import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiBookOpen,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const EditAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editReason, setEditReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/attendance/${id}`);
        setAttendance(data.attendance);
        setRecords(data.attendance.records || []);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load attendance record");
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [id]);

  const handleStatusChange = (studentId, newStatus) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.studentId._id === studentId ? { ...record, status: newStatus } : record
      )
    );
  };

  const handleRemarkChange = (studentId, newRemark) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.studentId._id === studentId ? { ...record, remarks: newRemark } : record
      )
    );
  };

  const handleAttendanceCountChange = (value) => {
    setAttendance((prev) => ({ ...prev, attendanceCount: parseInt(value) || 1 }));
  };

  const handleTimeChange = (field, value) => {
    setAttendance((prev) => ({ ...prev, [field]: value }));
  };

  const getSummary = () => {
    const summary = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
    records.forEach((record) => {
      summary[record.status]++;
    });
    return summary;
  };

  const handleSave = async () => {
    if (!editReason.trim()) {
      setErrorMessage("Edit reason is required for attendance modification.");
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    try {
      setSaving(true);
      await api.put(`/attendance/${id}/edit`, {
        editReason: editReason.trim(),
        records,
        attendanceCount: attendance.attendanceCount,
        startTime: attendance.startTime,
        endTime: attendance.endTime,
      });
      setSuccessMessage("Attendance updated successfully");
      setShowConfirmModal(false);
      setTimeout(() => {
        navigate("/admin/attendance");
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update attendance");
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading attendance record..." />;

  if (!attendance) {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Attendance Not Found"
          description="The attendance record you're looking for doesn't exist or you don't have permission to access it."
        />
        <button
          onClick={() => navigate("/admin/attendance")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Attendance Records
        </button>
      </section>
    );
  }

  const summary = getSummary();

  return (
    <section className="space-y-6 pb-28">
      <PageHeader
        eyebrow="Admin"
        title="Edit Attendance"
        description="Update submitted attendance with a required correction reason."
      />

      <AlertMessage tone="error" message={errorMessage} />
      <AlertMessage tone="success" message={successMessage} />

      {/* Top Summary */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {attendance.date ? new Date(attendance.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Academic Group</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {attendance.academicGroupId?.className || [attendance.academicGroupId?.department, attendance.academicGroupId?.course, attendance.academicGroupId?.section].filter(Boolean).join(" - ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {attendance.subjectId ? attendance.subjectId.subjectName : "General Attendance"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class Time</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="time"
                value={attendance.startTime || ""}
                onChange={(e) => handleTimeChange("startTime", e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none dark:text-white"
              />
              <span className="text-slate-400">-</span>
              <input
                type="time"
                value={attendance.endTime || ""}
                onChange={(e) => handleTimeChange("endTime", e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none dark:text-white"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance Count</p>
            <input
              type="number"
              min="1"
              max="8"
              value={attendance.attendanceCount || 1}
              onChange={(e) => handleAttendanceCountChange(e.target.value)}
              className="mt-1 w-24 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none dark:text-white"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marked By</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {attendance.markedBy?.name || "-"} ({attendance.markedBy?.role || "-"})
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.total}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Present Units</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{summary.present * (attendance.attendanceCount || 1)}</p>
        </div>
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Absent Units</p>
          <p className="mt-2 text-2xl font-bold text-red-800 dark:text-red-300">{summary.absent * (attendance.attendanceCount || 1)}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Late Units</p>
          <p className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-300">{summary.late * (attendance.attendanceCount || 1)}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 p-4 border border-sky-200 dark:border-sky-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Leave Units</p>
          <p className="mt-2 text-2xl font-bold text-sky-800 dark:text-sky-300">{summary.leave * (attendance.attendanceCount || 1)}</p>
        </div>
      </div>

      {/* Student Rows */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Student Attendance</h3>
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.studentId._id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {record.studentId.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Roll: {record.studentId.rollNumber || "N/A"}
                </p>
              </div>
              <div className="flex gap-1">
                {["present", "absent", "late", "leave"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(record.studentId._id, status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      record.status === status
                        ? status === "present"
                          ? "bg-emerald-500 text-white"
                          : status === "absent"
                          ? "bg-red-500 text-white"
                          : status === "late"
                          ? "bg-amber-500 text-white"
                          : "bg-sky-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={record.remarks || ""}
                onChange={(e) => handleRemarkChange(record.studentId._id, e.target.value)}
                placeholder="Remarks"
                className="w-full sm:w-32 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edit Reason */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Edit Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={editReason}
          onChange={(e) => setEditReason(e.target.value)}
          placeholder="Provide a reason for this attendance modification (e.g., Wrong status marked, Student was on approved leave, Teacher correction request)"
          rows={3}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {!editReason.trim() && (
          <p className="mt-1 text-xs text-red-500">Edit reason is required for attendance modification.</p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Confirm Attendance Update
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              You are modifying submitted attendance. This action will be recorded in audit logs.
            </p>
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Edit Reason:</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">{editReason}</p>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present:</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{summary.present}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent:</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{summary.absent}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late:</p>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{summary.late}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leave:</p>
                <p className="text-sm font-medium text-sky-600 dark:text-sky-400">{summary.leave}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Present: {summary.present}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Absent: {summary.absent}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Late: {summary.late}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Leave: {summary.leave}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/attendance")}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editReason.trim() || saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-4 h-4" />
              Save Attendance Changes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditAttendance;
