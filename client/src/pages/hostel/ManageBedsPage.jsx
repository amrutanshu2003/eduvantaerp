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
import { bedStatusOptions } from "../../utils/hostelOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageBedsPage = ({ basePath, eyebrow, title, description, nested = false }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const { roomId } = useParams();
  const [beds, setBeds] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ search: "", hostelId: "all", roomId: roomId || "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const canManage = canManageHostel(user);

  useEffect(() => {
    const loadBeds = async () => {
      try {
        const [bedResponse, supportResponse] = await Promise.all([
          nested ? api.get(`/hostel-rooms/${roomId}/beds`, { params: filters }) : api.get("/hostel-beds", { params: filters }),
          api.get("/hostels/support-data"),
        ]);
        setBeds(bedResponse.data.beds || []);
        setHostels(supportResponse.data.hostels || []);
        setRooms(supportResponse.data.rooms || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel beds");
      } finally {
        setLoading(false);
      }
    };
    loadBeds();
  }, [filters.search, filters.hostelId, filters.roomId, filters.status, nested, roomId]);

  const handleStatusUpdate = async (bedId, status) => {
    try {
      const { data } = await api.patch(`/hostel-beds/${bedId}/status`, { status });
      setBeds((current) => current.map((bed) => (bed._id === bedId ? data.bed : bed)));
      window.alert(`Bed marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update bed status");
    }
  };

  const handleDelete = async (bedId) => {
    if (!(await window.confirm("Delete this bed?"))) {
      return;
    }
    try {
      await api.delete(`/hostel-beds/${bedId}`);
      setBeds((current) => current.filter((bed) => bed._id !== bedId));
      window.alert("Bed deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete bed");
    }
  };

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel beds..." />;

  const filteredRooms = filters.hostelId === "all" ? rooms : rooms.filter((room) => room.hostelId === filters.hostelId || room.hostelId?._id === filters.hostelId);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={canManage ? <Link to={nested ? `${basePath}/hostel-rooms/${roomId}/beds/create` : `${basePath}/hostel-beds/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Add Bed</Link> : null} />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input placeholder="Search by bed, room, hostel" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        {!nested ? <select value={filters.hostelId} onChange={(event) => setFilters((current) => ({ ...current, hostelId: event.target.value, roomId: "all" }))} className={filterClass}><option value="all">All Hostels</option>{hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.hostelName}</option>)}</select> : null}
        {!nested ? <select value={filters.roomId} onChange={(event) => setFilters((current) => ({ ...current, roomId: event.target.value }))} className={filterClass}><option value="all">All Rooms</option>{filteredRooms.map((room) => <option key={room._id} value={room._id}>{room.roomNumber}</option>)}</select> : null}
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="all">All Status</option>{["available", "occupied", "maintenance", "inactive"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {beds.length === 0 ? <EmptyState title="No hostel beds found" description="Beds will appear here after room-wise bed setup." /> : <div className="grid gap-4">{beds.map((bed) => <div key={bed._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{bed.bedNumber}</h3><p className="mt-2 text-sm text-slate-600">{bed.hostel?.hostelName || "-"} • Room {bed.room?.roomNumber || "-"}</p></div><StatusBadge value={bed.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room Status</p><p className="mt-2 font-semibold text-ink">{formatLabel(bed.room?.status || "-")}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hostel Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(bed.hostel?.hostelType || "-")}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Link to={`${basePath}/hostel-beds/${bed._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>{canManage ? <Link to={`${basePath}/hostel-beds/${bed._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link> : null}{canManage && bedStatusOptions.filter((value) => value !== bed.status).map((value) => <button key={value} type="button" onClick={() => handleStatusUpdate(bed._id, value)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{formatLabel(value)}</button>)}{canManage ? <button type="button" onClick={() => handleDelete(bed._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button> : null}</div></div>)}</div>}
    </section>
  );
};

export default ManageBedsPage;
