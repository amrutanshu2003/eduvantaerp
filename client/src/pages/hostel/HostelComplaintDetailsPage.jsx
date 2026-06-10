import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { canManageHostel, canViewHostelWorkflow } from "../../utils/hostelAccess";
import { complaintStatusOptions } from "../../utils/hostelWorkflowOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const HostelComplaintDetailsPage = ({ eyebrow, roleMode }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [supportData, setSupportData] = useState({ staff: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [complaintResponse, supportResponse] = await Promise.all([
          api.get(`/hostel-complaints/${id}`),
          roleMode === "manager"
            ? api.get("/hostels/support-data")
            : Promise.resolve({ data: { staff: [] } }),
        ]);

        setComplaint(complaintResponse.data.complaint);
        setSupportData({ staff: supportResponse.data.staff || [] });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel complaint");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, roleMode]);

  const allowed =
    roleMode === "manager"
      ? canViewHostelWorkflow(user)
      : roleMode === "student"
        ? user?.role === "student"
        : user?.role === "parent";

  const canManage = roleMode === "manager" && canManageHostel(user);

  const handleAssign = async (assignedTo) => {
    try {
      const { data } = await api.patch(`/hostel-complaints/${id}/assign`, { assignedTo });
      setComplaint(data.complaint);
      window.alert("Complaint assigned successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to assign complaint");
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const { data } = await api.patch(`/hostel-complaints/${id}/status`, { status });
      setComplaint(data.complaint);
      window.alert(`Complaint marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update complaint status");
    }
  };

  if (!allowed) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel complaint details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={complaint?.title || "Hostel Complaint"}
        description="Review complaint status, assignment, and hostel resolution notes."
      />

      <AlertMessage tone="error" message={errorMessage} />

      {complaint ? (
        <div className="space-y-6">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{complaint.complaintType}</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">
                  {complaint.student?.name || "Student Complaint"}
                </h2>
              </div>
              <StatusBadge value={complaint.status} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bed</p>
                <p className="mt-2 font-semibold text-ink">
                  {complaint.hostelAllocation?.bedId?.bedNumber || "-"}
                </p>
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</p>
                <p className="mt-2 font-semibold text-ink">{complaint.description}</p>
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resolution Note</p>
                <p className="mt-2 font-semibold text-ink">{complaint.resolutionNote || "-"}</p>
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <h3 className="text-xl font-semibold text-ink">Manage Complaint</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select
                  value={complaint.assignedStaff?._id || ""}
                  onChange={(event) => handleAssign(event.target.value || null)}
                  className={inputClass}
                >
                  <option value="">Unassigned</option>
                  {supportData.staff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>

                <select
                  value={complaint.status}
                  onChange={(event) => handleStatusUpdate(event.target.value)}
                  className={inputClass}
                >
                  {complaintStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default HostelComplaintDetailsPage;
