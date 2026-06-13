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
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, canViewHostel } from "../../utils/hostelAccess";
import { hostelStatusOptions, hostelTypeOptions } from "../../utils/hostelOptions";

const ManageHostelsPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [hostels, setHostels] = useState([]);
  const [filters, setFilters] = useState({ search: "", hostelType: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const canManage = canManageHostel(user);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const loadHostels = async () => {
      try {
        const { data } = await api.get("/hostels", { params: filters });
        setHostels(data.hostels || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostels");
      } finally {
        setLoading(false);
      }
    };

    loadHostels();
  }, [filters.search, filters.hostelType, filters.status]);

  const handleStatusUpdate = async (hostel, status) => {
    setConfirmModal({
      type: "status",
      hostel,
      status,
      title: `Mark hostel as ${status}?`,
      message: `This hostel will be marked as ${status}.`,
    });
  };

  const confirmStatusUpdate = async () => {
    if (!confirmModal) return;
    const { hostel, status } = confirmModal;
    try {
      setActionLoading(true);
      const { data } = await api.patch(`/hostels/${hostel._id}/status`, { status });
      setHostels((current) => current.map((h) => (h._id === hostel._id ? data.hostel : h)));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update hostel status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (hostel) => {
    setConfirmModal({
      type: "delete",
      hostel,
      title: "Delete Hostel?",
      message: "This action will remove the hostel record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { hostel } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/hostels/${hostel._id}`);
      setHostels((current) => current.filter((h) => h._id !== hostel._id));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete hostel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: "", hostelType: "all", status: "all" });
  };

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostels..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          canManage ? (
            <Link
              to={`${basePath}/hostels/create`}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Add Hostel
            </Link>
          ) : null
        }
      />
      <FilterBar
        filters={filters}
        onFilterChange={(event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSearch={() => {}}
        onReset={handleResetFilters}
        searchPlaceholder="Search by hostel name, code, warden"
      >
        <input
          name="search"
          placeholder="Search by hostel name, code, warden"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select name="hostelType" value={filters.hostelType} onChange={(event) => setFilters((current) => ({ ...current, hostelType: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Types</option>
          {hostelTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Status</option>
          {hostelStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </FilterBar>
      <AlertMessage tone="error" message={errorMessage} />
      {hostels.length === 0 ? (
        <EmptyState title="No hostels found" description="Create the first hostel to start room and bed management." />
      ) : (
        <TableShell
          headers={["Hostel", "Warden", "Floors", "Contact", "Status", "Actions"]}
        >
          {hostels.map((hostel) => (
            <tr key={hostel._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{hostel.hostelName}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{hostel.hostelCode} • {formatLabel(hostel.hostelType)}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{hostel.warden?.name || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{hostel.totalFloors}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{hostel.contactNumber || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={hostel.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={hostel}
                  isActive={hostel.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={hostel.status === "active" ? () => handleStatusUpdate(hostel, "inactive") : undefined}
                  onActivate={hostel.status === "inactive" ? () => handleStatusUpdate(hostel, "active") : undefined}
                  onDelete={canManage ? () => handleDelete(hostel) : undefined}
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

export default ManageHostelsPage;
