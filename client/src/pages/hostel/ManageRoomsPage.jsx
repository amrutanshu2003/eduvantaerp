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
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, canViewHostel } from "../../utils/hostelAccess";
import { roomStatusOptions } from "../../utils/hostelOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageRoomsPage = ({ basePath, eyebrow, title, description, nested = false }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const { hostelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [filters, setFilters] = useState({ search: "", hostelId: hostelId || "all", floorNumber: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const canManage = canManageHostel(user);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const [roomResponse, supportResponse] = await Promise.all([
          nested ? api.get(`/hostels/${hostelId}/rooms`, { params: filters }) : api.get("/hostel-rooms", { params: filters }),
          api.get("/hostels/support-data"),
        ]);
        setRooms(roomResponse.data.rooms || []);
        setHostels(supportResponse.data.hostels || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel rooms");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [filters.search, filters.hostelId, filters.floorNumber, filters.status, hostelId, nested]);

  const handleStatusUpdate = async (roomId, status) => {
    try {
      const { data } = await api.patch(`/hostel-rooms/${roomId}/status`, { status });
      setRooms((current) => current.map((room) => (room._id === roomId ? data.room : room)));
      window.alert(`Room marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update room status");
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm("Delete this room?")) {
      return;
    }
    try {
      await api.delete(`/hostel-rooms/${roomId}`);
      setRooms((current) => current.filter((room) => room._id !== roomId));
      window.alert("Room deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete room");
    }
  };

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel rooms..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={canManage ? <Link to={nested ? `${basePath}/hostels/${hostelId}/rooms/create` : `${basePath}/hostel-rooms/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Add Room</Link> : null}
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input placeholder="Search by room or hostel" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        {!nested ? <select value={filters.hostelId} onChange={(event) => setFilters((current) => ({ ...current, hostelId: event.target.value }))} className={filterClass}><option value="all">All Hostels</option>{hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.hostelName}</option>)}</select> : null}
        <input placeholder="Floor Number" value={filters.floorNumber === "all" ? "" : filters.floorNumber} onChange={(event) => setFilters((current) => ({ ...current, floorNumber: event.target.value || "all" }))} className={filterClass} />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="all">All Status</option>{roomStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {rooms.length === 0 ? (
        <EmptyState title="No hostel rooms found" description="Rooms will appear here once created under a hostel." />
      ) : (
        <div className="grid gap-4">
          {rooms.map((room) => (
            <div key={room._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{room.roomNumber}</h3>
                  <p className="mt-2 text-sm text-slate-600">{room.hostel?.hostelName || "-"} • Floor {room.floorNumber}</p>
                </div>
                <StatusBadge value={room.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(room.roomType)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Capacity</p><p className="mt-2 font-semibold text-ink">{room.capacity}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Occupied Beds</p><p className="mt-2 font-semibold text-ink">{room.occupiedBeds}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`${basePath}/hostel-rooms/${room._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                <Link to={`${basePath}/hostel-rooms/${room._id}/beds`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Beds</Link>
                {canManage ? <Link to={`${basePath}/hostel-rooms/${room._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link> : null}
                {canManage && room.status !== "available" ? <button type="button" onClick={() => handleStatusUpdate(room._id, "available")} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Available</button> : null}
                {canManage && room.status !== "maintenance" ? <button type="button" onClick={() => handleStatusUpdate(room._id, "maintenance")} className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">Maintenance</button> : null}
                {canManage && room.status !== "inactive" ? <button type="button" onClick={() => handleStatusUpdate(room._id, "inactive")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Inactive</button> : null}
                {canManage ? <button type="button" onClick={() => handleDelete(room._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManageRoomsPage;
