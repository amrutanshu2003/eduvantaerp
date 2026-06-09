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
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, canViewHostel } from "../../utils/hostelAccess";
import { hostelStatusOptions, hostelTypeOptions } from "../../utils/hostelOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageHostelsPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [hostels, setHostels] = useState([]);
  const [filters, setFilters] = useState({ search: "", hostelType: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const canManage = canManageHostel(user);

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

  const handleStatusUpdate = async (hostelId, status) => {
    try {
      const { data } = await api.patch(`/hostels/${hostelId}/status`, { status });
      setHostels((current) => current.map((hostel) => (hostel._id === hostelId ? data.hostel : hostel)));
      window.alert(`Hostel marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update hostel status");
    }
  };

  const handleDelete = async (hostelId) => {
    if (!window.confirm("Delete this hostel?")) {
      return;
    }

    try {
      await api.delete(`/hostels/${hostelId}`);
      setHostels((current) => current.filter((hostel) => hostel._id !== hostelId));
      window.alert("Hostel deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete hostel");
    }
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
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
        <input placeholder="Search by hostel name, code, warden" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        <select value={filters.hostelType} onChange={(event) => setFilters((current) => ({ ...current, hostelType: event.target.value }))} className={filterClass}>
          <option value="all">All Types</option>
          {hostelTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          {hostelStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {hostels.length === 0 ? (
        <EmptyState title="No hostels found" description="Create the first hostel to start room and bed management." />
      ) : (
        <div className="grid gap-4">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{hostel.hostelName}</h3>
                  <p className="mt-2 text-sm text-slate-600">{hostel.hostelCode} • {formatLabel(hostel.hostelType)}</p>
                </div>
                <StatusBadge value={hostel.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden</p><p className="mt-2 font-semibold text-ink">{hostel.warden?.name || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Floors</p><p className="mt-2 font-semibold text-ink">{hostel.totalFloors}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p><p className="mt-2 font-semibold text-ink">{hostel.contactNumber || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</p><p className="mt-2 font-semibold text-ink">{hostel.address || "-"}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`${basePath}/hostels/${hostel._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                <Link to={`${basePath}/hostels/${hostel._id}/rooms`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Rooms</Link>
                {canManage ? <Link to={`${basePath}/hostels/${hostel._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link> : null}
                {canManage && hostel.status !== "active" ? <button type="button" onClick={() => handleStatusUpdate(hostel._id, "active")} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Activate</button> : null}
                {canManage && hostel.status !== "inactive" ? <button type="button" onClick={() => handleStatusUpdate(hostel._id, "inactive")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Deactivate</button> : null}
                {canManage && hostel.status !== "maintenance" ? <button type="button" onClick={() => handleStatusUpdate(hostel._id, "maintenance")} className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">Maintenance</button> : null}
                {canManage ? <button type="button" onClick={() => handleDelete(hostel._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageHostelsPage;
