import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageHostel, canViewHostelWorkflow } from "../../utils/hostelAccess";
import {
  complaintPriorityOptions,
  complaintStatusOptions,
  complaintTypeOptions,
} from "../../utils/hostelWorkflowOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageComplaintsPage = ({ basePath, eyebrow, title, description, mode }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const { studentId } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [supportData, setSupportData] = useState({ students: [] });
  const [filters, setFilters] = useState({
    studentId: "all",
    complaintType: "all",
    priority: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint =
          mode === "student"
            ? "/hostel-complaints/my-complaints"
            : mode === "parent-child"
              ? `/hostel-complaints/child/${studentId}`
              : "/hostel-complaints";

        const [complaintResponse, supportResponse] = await Promise.all([
          api.get(endpoint, mode === "manager" ? { params: filters } : undefined),
          mode === "manager" ? api.get("/hostels/support-data") : Promise.resolve({ data: { students: [] } }),
        ]);

        setComplaints(complaintResponse.data.complaints || []);
        setSupportData({ students: supportResponse.data.students || [] });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel complaints");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters.studentId, filters.complaintType, filters.priority, filters.status, mode, studentId]);

  const canManage = canManageHostel(user);
  const canView = mode === "manager" ? canViewHostelWorkflow(user) : true;

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.patch(`/hostel-complaints/${id}/status`, { status });
      setComplaints((current) => current.map((entry) => (entry._id === id ? data.complaint : entry)));
      window.alert(`Complaint marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update complaint status");
    }
  };

  if (!canView) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel complaints..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          mode === "student" ? (
            <Link
              to={`${basePath}/hostel/complaints/create`}
              style={{
                backgroundColor: settings.primaryColor,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Raise Complaint
            </Link>
          ) : null
        }
      />

      {mode === "manager" ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
          <select
            value={filters.studentId}
            onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Students</option>
            {supportData.students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.userId?.name || student.admissionNumber}
              </option>
            ))}
          </select>

          <select
            value={filters.complaintType}
            onChange={(event) => setFilters((current) => ({ ...current, complaintType: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Types</option>
            {complaintTypeOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Priorities</option>
            {complaintPriorityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Status</option>
            {complaintStatusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <AlertMessage tone="error" message={errorMessage} />

      {complaints.length === 0 ? (
        <EmptyState title="No hostel complaints found" description="Hostel complaints will appear here." />
      ) : (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{complaint.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {complaint.student?.userId?.name || "Student"} | {complaint.complaintType}
                  </p>
                </div>
                <StatusBadge value={complaint.status} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Priority</p>
                  <p className="mt-2 font-semibold text-ink">{complaint.priority}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Assigned To</p>
                  <p className="mt-2 font-semibold text-ink">{complaint.assignedStaff?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hostel Room</p>
                  <p className="mt-2 font-semibold text-ink">
                    {complaint.hostelAllocation?.roomId?.roomNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={mode === "manager" ? `${basePath}/hostel-complaints/${complaint._id}` : `${basePath}/hostel/complaints/${complaint._id}`}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  View
                </Link>

                {mode === "manager" && canManage
                  ? complaintStatusOptions
                      .filter((value) => value !== complaint.status)
                      .slice(0, 2)
                      .map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleStatusUpdate(complaint._id, value)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          {value}
                        </button>
                      ))
                  : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageComplaintsPage;
