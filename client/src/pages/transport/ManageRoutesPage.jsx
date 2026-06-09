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
import { formatCurrency } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageRoutesPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ search: "", vehicleId: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const [routeResponse, vehicleResponse] = await Promise.all([
          api.get("/transport/routes", { params: filters }),
          api.get("/transport/vehicles"),
        ]);
        setRoutes(routeResponse.data.routes || []);
        setVehicles(vehicleResponse.data.vehicles || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load routes");
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, [filters.search, filters.vehicleId, filters.status]);

  const handleStatusUpdate = async (routeId, status) => {
    try {
      const { data } = await api.patch(`/transport/routes/${routeId}/status`, { status });
      setRoutes((current) => current.map((route) => (route._id === routeId ? data.route : route)));
      window.alert(`Route marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update route status");
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm("Delete this route?")) {
      return;
    }

    try {
      await api.delete(`/transport/routes/${routeId}`);
      setRoutes((current) => current.filter((route) => route._id !== routeId));
      window.alert("Route deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete route");
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading transport routes..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Link
            to={`${basePath}/routes/create`}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Add Route
          </Link>
        }
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
        <input placeholder="Search by route, code, point" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        <select value={filters.vehicleId} onChange={(event) => setFilters((current) => ({ ...current, vehicleId: event.target.value }))} className={filterClass}>
          <option value="all">All Vehicles</option>
          {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {routes.length === 0 ? (
        <EmptyState title="No transport routes found" description="Create a route with stops and assigned vehicle details." />
      ) : (
        <div className="grid gap-4">
          {routes.map((route) => (
            <div key={route._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{route.routeName}</h3>
                  <p className="mt-2 text-sm text-slate-600">{route.routeCode} • {route.startPoint} to {route.endPoint}</p>
                </div>
                <StatusBadge value={route.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vehicle</p><p className="mt-2 font-semibold text-ink">{route.vehicle?.vehicleNumber || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p><p className="mt-2 font-semibold text-ink">{route.driver?.name || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stops</p><p className="mt-2 font-semibold text-ink">{route.stops?.length || 0}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(route.monthlyFee)}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`${basePath}/routes/${route._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                <Link to={`${basePath}/routes/${route._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                <button type="button" onClick={() => handleStatusUpdate(route._id, route.status === "active" ? "inactive" : "active")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{route.status === "active" ? "Deactivate" : "Activate"}</button>
                <button type="button" onClick={() => handleDelete(route._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageRoutesPage;
