import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";
import { vehicleStatusOptions, vehicleTypeOptions } from "../../utils/transportOptions";

const ManageVehiclesPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ search: "", vehicleType: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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

  const handleStatusUpdate = async (vehicle, status) => {
    setConfirmModal({
      type: "status",
      vehicle,
      status,
      title: `Mark vehicle as ${status}?`,
      message: `This vehicle will be marked as ${status}.`,
    });
  };

  const confirmStatusUpdate = async () => {
    if (!confirmModal) return;
    const { vehicle, status } = confirmModal;
    try {
      setActionLoading(true);
      const { data } = await api.patch(`/transport/vehicles/${vehicle._id}/status`, { status });
      setVehicles((current) => current.map((v) => (v._id === vehicle._id ? data.vehicle : v)));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update vehicle status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (vehicle) => {
    setConfirmModal({
      type: "delete",
      vehicle,
      title: "Delete Vehicle?",
      message: "This action will remove the vehicle record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { vehicle } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/transport/vehicles/${vehicle._id}`);
      setVehicles((current) => current.filter((v) => v._id !== vehicle._id));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete vehicle");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: "", vehicleType: "all", status: "all" });
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
      <FilterBar
        filters={filters}
        onFilterChange={(event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSearch={() => {}}
        onReset={handleResetFilters}
        searchPlaceholder="Search by number, type, or driver"
      >
        <input
          name="search"
          placeholder="Search by number, type, or driver"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select
          name="vehicleType"
          value={filters.vehicleType}
          onChange={(event) => setFilters((current) => ({ ...current, vehicleType: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Types</option>
          {vehicleTypeOptions.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Status</option>
          {vehicleStatusOptions.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
      </FilterBar>
      <AlertMessage tone="error" message={errorMessage} />
      {vehicles.length === 0 ? (
        <EmptyState title="No vehicles found" description="Add the first institute vehicle to start transport operations." />
      ) : (
        <TableShell
          headers={["Vehicle", "Type", "Driver", "Helper", "Insurance Expiry", "Status", "Actions"]}
        >
          {vehicles.map((vehicle) => (
            <tr key={vehicle._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{vehicle.vehicleNumber}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Capacity {vehicle.capacity}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatLabel(vehicle.vehicleType)}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{vehicle.driver?.name || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{vehicle.helper?.name || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatDate(vehicle.insuranceExpiry)}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={vehicle.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={vehicle}
                  isActive={vehicle.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={vehicle.status === "active" ? () => handleStatusUpdate(vehicle, "inactive") : undefined}
                  onActivate={vehicle.status === "inactive" ? () => handleStatusUpdate(vehicle, "active") : undefined}
                  onDelete={() => handleDelete(vehicle)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "delete" ? confirmDelete : confirmStatusUpdate}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.status}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default ManageVehiclesPage;
