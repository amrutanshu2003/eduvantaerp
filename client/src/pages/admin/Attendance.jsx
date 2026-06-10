import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/attendance");
      setAttendance(data.attendance || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleDelete = async (attendanceId) => {
    if (!(await window.confirm("Are you sure you want to delete this attendance record? This will move it to the Recycle Bin."))) {
      return;
    }

    try {
      await api.delete(`/attendance/${attendanceId}`);
      setSuccessMessage("Attendance record deleted successfully");
      setAttendance((current) => current.filter((item) => item._id !== attendanceId));
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete attendance record");
    }
  };

  if (loading) return <LoadingBlock message="Loading attendance records..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Attendance Records"
        description="View and manage attendance sheets submitted across classes and academic groups."
      />

      <AlertMessage tone="error" message={errorMessage} />
      <AlertMessage tone="success" message={successMessage} />

      {attendance.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="There are currently no attendance submissions recorded."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Academic Group</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Marked By</th>
                  <th className="px-6 py-4 font-medium">Present / Total</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => {
                  const totalStudents = record.records?.length || 0;
                  const presentStudents = record.records?.filter((r) => r.status === "present" || r.status === "late").length || 0;
                  return (
                    <tr key={record._id} className="border-t border-slate-100">
                      <td className="px-6 py-4 font-medium text-ink">
                        {record.date ? new Date(record.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }) : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">
                        {record.academicGroupId?.className || [record.academicGroupId?.department, record.academicGroupId?.course, record.academicGroupId?.section].filter(Boolean).join(" - ") || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {record.subjectId ? (
                          <div>
                            <p className="font-medium">{record.subjectId.subjectName}</p>
                            <p className="text-xs text-slate-400">{record.subjectId.subjectCode}</p>
                          </div>
                        ) : (
                          "General Attendance"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="font-semibold">{record.markedBy?.name || "-"}</span>
                        <span className="ml-1 text-xs text-slate-400">({record.markedBy?.role || "-"})</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">{presentStudents}</span>
                        <span className="text-slate-400"> / {totalStudents}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(record._id)}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default Attendance;
