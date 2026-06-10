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
import { formatDate } from "../../utils/formatters";
import { outpassFinalStatusOptions } from "../../utils/hostelWorkflowOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageOutpassesPage = ({ basePath, eyebrow, title, description, mode }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const { studentId } = useParams();
  const [outpasses, setOutpasses] = useState([]);
  const [supportData, setSupportData] = useState({ students: [], hostels: [] });
  const [filters, setFilters] = useState({ studentId: "all", hostelId: "all", finalStatus: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint =
          mode === "student"
            ? "/hostel-outpasses/my-outpasses"
            : mode === "parent-child"
              ? `/hostel-outpasses/child/${studentId}`
              : "/hostel-outpasses";

        const [outpassResponse, supportResponse] = await Promise.all([
          api.get(endpoint, mode === "manager" ? { params: filters } : undefined),
          mode === "manager"
            ? api.get("/hostels/support-data")
            : Promise.resolve({ data: { students: [], hostels: [] } }),
        ]);

        setOutpasses(outpassResponse.data.outpasses || []);
        setSupportData({
          students: supportResponse.data.students || [],
          hostels: supportResponse.data.hostels || [],
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel outpasses");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.finalStatus, filters.hostelId, filters.studentId, mode, studentId]);

  const canManage = canManageHostel(user);
  const canView = mode === "manager" ? canViewHostelWorkflow(user) : true;

  const handleParentApproval = async (id, status) => {
    try {
      const { data } = await api.patch(`/hostel-outpasses/${id}/parent-approval`, { status });
      setOutpasses((current) => current.map((entry) => (entry._id === id ? data.outpass : entry)));
      window.alert(`Outpass ${status} by parent`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update parent approval");
    }
  };

  const handleWardenApproval = async (id, status) => {
    try {
      const { data } = await api.patch(`/hostel-outpasses/${id}/warden-approval`, { status });
      setOutpasses((current) => current.map((entry) => (entry._id === id ? data.outpass : entry)));
      window.alert(`Outpass ${status} by warden`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update warden approval");
    }
  };

  const handleCancel = async (id) => {
    try {
      const { data } = await api.patch(`/hostel-outpasses/${id}/cancel`, {});
      setOutpasses((current) => current.map((entry) => (entry._id === id ? data.outpass : entry)));
      window.alert("Outpass cancelled");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to cancel outpass");
    }
  };

  if (!canView) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel outpasses..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          mode === "student" ? (
            <Link
              to={`${basePath}/hostel/outpasses/create`}
              style={{
                backgroundColor: settings.primaryColor,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Create Outpass
            </Link>
          ) : null
        }
      />

      {mode === "manager" ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
          <select
            value={filters.studentId}
            onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Students</option>
            {supportData.students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name || student.admissionNumber}
              </option>
            ))}
          </select>

          <select
            value={filters.hostelId}
            onChange={(event) => setFilters((current) => ({ ...current, hostelId: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Hostels</option>
            {supportData.hostels.map((hostel) => (
              <option key={hostel._id} value={hostel._id}>
                {hostel.hostelName}
              </option>
            ))}
          </select>

          <select
            value={filters.finalStatus}
            onChange={(event) => setFilters((current) => ({ ...current, finalStatus: event.target.value }))}
            className={filterClass}
          >
            <option value="all">All Status</option>
            {outpassFinalStatusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <AlertMessage tone="error" message={errorMessage} />

      {outpasses.length === 0 ? (
        <EmptyState title="No hostel outpasses found" description="Outpass requests will appear here." />
      ) : (
        <div className="grid gap-4">
          {outpasses.map((outpass) => (
            <div key={outpass._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    {outpass.student?.name || "Outpass Request"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {outpass.reason} | {outpass.destination}
                  </p>
                </div>
                <StatusBadge value={outpass.finalStatus} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">From</p>
                  <p className="mt-2 font-semibold text-ink">{formatDate(outpass.fromDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">To</p>
                  <p className="mt-2 font-semibold text-ink">{formatDate(outpass.toDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parent Approval</p>
                  <p className="mt-2 font-semibold text-ink">{outpass.parentApprovalStatus}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden Approval</p>
                  <p className="mt-2 font-semibold text-ink">{outpass.wardenApprovalStatus}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={mode === "manager" ? `${basePath}/hostel-outpasses/${outpass._id}` : `${basePath}/hostel/outpasses/${outpass._id}`}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  View
                </Link>

                {mode === "parent-child" &&
                outpass.parentApprovalRequired &&
                outpass.parentApprovalStatus === "pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleParentApproval(outpass._id, "approved")}
                      className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleParentApproval(outpass._id, "rejected")}
                      className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {mode === "manager" &&
                canManage &&
                outpass.finalStatus !== "approved" &&
                outpass.finalStatus !== "rejected" &&
                outpass.finalStatus !== "cancelled" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleWardenApproval(outpass._id, "approved")}
                      className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWardenApproval(outpass._id, "rejected")}
                      className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {mode === "student" && ["pending", "parent_approved"].includes(outpass.finalStatus) ? (
                  <button
                    type="button"
                    onClick={() => handleCancel(outpass._id)}
                    className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageOutpassesPage;
