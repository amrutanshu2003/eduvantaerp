import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageAllocationsPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [allocations, setAllocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ search: "", routeId: "all", studentId: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allocationResponse, routeResponse, supportResponse] = await Promise.all([
          api.get("/transport/allocations", { params: filters }),
          api.get("/transport/routes"),
          api.get("/transport/support-data"),
        ]);
        setAllocations(allocationResponse.data.allocations || []);
        setRoutes(routeResponse.data.routes || []);
        setStudents(supportResponse.data.students || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load transport allocations");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.search, filters.routeId, filters.studentId, filters.status]);

  const handleStatusUpdate = async (allocationId, status) => {
    try {
      const { data } = await api.patch(`/transport/allocations/${allocationId}/status`, { status });
      setAllocations((current) => current.map((allocation) => (allocation._id === allocationId ? data.allocation : allocation)));
      window.alert(`Allocation marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update allocation status");
    }
  };

  const handleDelete = async (allocationId) => {
    if (!window.confirm("Delete this transport allocation?")) {
      return;
    }

    try {
      await api.delete(`/transport/allocations/${allocationId}`);
      setAllocations((current) => current.filter((allocation) => allocation._id !== allocationId));
      window.alert("Allocation deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete allocation");
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading transport allocations..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Link
            to={`${basePath}/allocations/create`}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Allocation
          </Link>
        }
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input placeholder="Search by student, route, stop" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        <select value={filters.routeId} onChange={(event) => setFilters((current) => ({ ...current, routeId: event.target.value }))} className={filterClass}>
          <option value="all">All Routes</option>
          {routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}
        </select>
        <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className={filterClass}>
          <option value="all">All Students</option>
          {students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.user?.name || student.admissionNumber}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {allocations.length === 0 ? (
        <EmptyState title="No transport allocations found" description="Allocate students to route stops to track transport usage." />
      ) : (
        <div className="grid gap-4">
          {allocations.map((allocation) => (
            <div key={allocation._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{allocation.student?.userId?.name || "Student"}</h3>
                  <p className="mt-2 text-sm text-slate-600">{allocation.route?.routeName || "-"} • Stop {allocation.stopName}</p>
                </div>
                <StatusBadge value={allocation.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-5">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pickup</p><p className="mt-2 font-semibold text-ink">{allocation.pickupTime || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Drop</p><p className="mt-2 font-semibold text-ink">{allocation.dropTime || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Start Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.startDate)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vehicle</p><p className="mt-2 font-semibold text-ink">{allocation.route?.vehicle?.vehicleNumber || "-"}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`${basePath}/allocations/${allocation._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                <Link to={`${basePath}/allocations/${allocation._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                <button type="button" onClick={() => handleStatusUpdate(allocation._id, allocation.status === "active" ? "inactive" : "active")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{allocation.status === "active" ? "Deactivate" : "Activate"}</button>
                <button type="button" onClick={() => handleDelete(allocation._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageAllocationsPage;
