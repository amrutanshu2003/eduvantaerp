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
import { formatDate, formatLabel } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";
import { vehicleStatusOptions, vehicleTypeOptions } from "../../utils/transportOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageVehiclesPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ search: "", vehicleType: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const { data } = await api.get("/transport/vehicles", { params: filters });
        setVehicles(data.vehicles || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load vehicles");
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, [filters.search, filters.vehicleType, filters.status]);

  const handleStatusUpdate = async (vehicleId, status) => {
    try {
      const { data } = await api.patch(`/transport/vehicles/${vehicleId}/status`, { status });
      setVehicles((current) => current.map((vehicle) => (vehicle._id === vehicleId ? data.vehicle : vehicle)));
      window.alert(`Vehicle marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update vehicle status");
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!(await window.confirm("Delete this vehicle?"))) {
      return;
    }

    try {
      await api.delete(`/transport/vehicles/${vehicleId}`);
      setVehicles((current) => current.filter((vehicle) => vehicle._id !== vehicleId));
      window.alert("Vehicle deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete vehicle");
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading transport vehicles..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Link
            to={`${basePath}/vehicles/create`}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Add Vehicle
          </Link>
        }
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
        <input
          placeholder="Search by number, type, or driver"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className={filterClass}
        />
        <select
          value={filters.vehicleType}
          onChange={(event) => setFilters((current) => ({ ...current, vehicleType: event.target.value }))}
          className={filterClass}
        >
          <option value="all">All Types</option>
          {vehicleTypeOptions.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className={filterClass}
        >
          <option value="all">All Status</option>
          {vehicleStatusOptions.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {vehicles.length === 0 ? (
        <EmptyState title="No vehicles found" description="Add the first institute vehicle to start transport operations." />
      ) : (
        <div className="grid gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{vehicle.vehicleNumber}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatLabel(vehicle.vehicleType)} • Capacity {vehicle.capacity}
                  </p>
                </div>
                <StatusBadge value={vehicle.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p>
                  <p className="mt-2 font-semibold text-ink">{vehicle.driver?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper</p>
                  <p className="mt-2 font-semibold text-ink">{vehicle.helper?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insurance Expiry</p>
                  <p className="mt-2 font-semibold text-ink">{formatDate(vehicle.insuranceExpiry)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fitness Expiry</p>
                  <p className="mt-2 font-semibold text-ink">{formatDate(vehicle.fitnessExpiry)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`${basePath}/vehicles/${vehicle._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  View
                </Link>
                <Link to={`${basePath}/vehicles/${vehicle._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  Edit
                </Link>
                {vehicle.status !== "active" ? (
                  <button type="button" onClick={() => handleStatusUpdate(vehicle._id, "active")} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Activate
                  </button>
                ) : null}
                {vehicle.status !== "inactive" ? (
                  <button type="button" onClick={() => handleStatusUpdate(vehicle._id, "inactive")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                    Deactivate
                  </button>
                ) : null}
                {vehicle.status !== "maintenance" ? (
                  <button type="button" onClick={() => handleStatusUpdate(vehicle._id, "maintenance")} className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">
                    Maintenance
                  </button>
                ) : null}
                <button type="button" onClick={() => handleDelete(vehicle._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageVehiclesPage;
