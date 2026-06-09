import { useEffect, useMemo, useState } from "react";
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
import { canManageHostel } from "../../utils/hostelAccess";
import { hostelAllocationStatusOptions } from "../../utils/hostelWorkflowOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageAllocationsPage = ({ basePath, eyebrow, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [allocations, setAllocations] = useState([]);
  const [supportData, setSupportData] = useState({ students: [], hostels: [], rooms: [] });
  const [filters, setFilters] = useState({ search: "", hostelId: "all", roomId: "all", studentId: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allocationResponse, supportResponse] = await Promise.all([
          api.get("/hostel-allocations", { params: filters }),
          api.get("/hostel-allocations/support-data"),
        ]);
        setAllocations(allocationResponse.data.allocations || []);
        setSupportData({
          students: supportResponse.data.students || [],
          hostels: supportResponse.data.hostels || [],
          rooms: supportResponse.data.rooms || [],
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel allocations");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters.search, filters.hostelId, filters.roomId, filters.studentId, filters.status]);

  const filteredRooms = useMemo(
    () =>
      filters.hostelId === "all"
        ? supportData.rooms
        : supportData.rooms.filter((room) => String(room.hostelId) === String(filters.hostelId)),
    [filters.hostelId, supportData.rooms]
  );

  const handleLeave = async (allocationId) => {
    try {
      const { data } = await api.patch(`/hostel-allocations/${allocationId}/leave`, {});
      setAllocations((current) => current.map((entry) => (entry._id === allocationId ? data.allocation : entry)));
      window.alert("Allocation marked as left");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to mark allocation as left");
    }
  };

  const handleCancel = async (allocationId) => {
    try {
      const { data } = await api.patch(`/hostel-allocations/${allocationId}/cancel`, {});
      setAllocations((current) => current.map((entry) => (entry._id === allocationId ? data.allocation : entry)));
      window.alert("Allocation cancelled");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to cancel allocation");
    }
  };

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel allocations..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Link to={`${basePath}/hostel-allocations/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">
            Create Allocation
          </Link>
        }
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-5">
        <input placeholder="Search by student, room, hostel" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        <select value={filters.hostelId} onChange={(event) => setFilters((current) => ({ ...current, hostelId: event.target.value, roomId: "all" }))} className={filterClass}><option value="all">All Hostels</option>{supportData.hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.hostelName}</option>)}</select>
        <select value={filters.roomId} onChange={(event) => setFilters((current) => ({ ...current, roomId: event.target.value }))} className={filterClass}><option value="all">All Rooms</option>{filteredRooms.map((room) => <option key={room._id} value={room._id}>{room.roomNumber}</option>)}</select>
        <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className={filterClass}><option value="all">All Students</option>{supportData.students.map((student) => <option key={student._id} value={student._id}>{student.userId?.name || student.admissionNumber}</option>)}</select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="all">All Status</option>{hostelAllocationStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {allocations.length === 0 ? <EmptyState title="No hostel allocations found" description="Student hostel allocations will appear here." /> : <div className="grid gap-4">{allocations.map((allocation) => <div key={allocation._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{allocation.student?.userId?.name || "Student"}</h3><p className="mt-2 text-sm text-slate-600">{allocation.hostel?.hostelName || "-"} • Room {allocation.room?.roomNumber || "-"} • Bed {allocation.bed?.bedNumber || "-"}</p></div><StatusBadge value={allocation.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-5"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allocation Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.allocationDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leaving Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.leavingDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.securityDeposit)}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Link to={`${basePath}/hostel-allocations/${allocation._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`${basePath}/hostel-allocations/${allocation._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>{allocation.status === "active" ? <button type="button" onClick={() => handleLeave(allocation._id)} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Mark Left</button> : null}{allocation.status === "active" ? <button type="button" onClick={() => handleCancel(allocation._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Cancel</button> : null}</div></div>)}</div>}
    </section>
  );
};

export default ManageAllocationsPage;
