import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, canViewHostel } from "../../utils/hostelAccess";

const RoomDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const { data } = await api.get(`/hostel-rooms/${id}`);
        setRoom(data.room);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load room details");
      } finally {
        setLoading(false);
      }
    };
    loadRoom();
  }, [id]);

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel room details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={room?.roomNumber || "Room Details"} description="Review room type, capacity, floor number, and current occupied beds." actions={room ? <div className="flex flex-wrap gap-3"><Link to={`${basePath}/hostel-rooms/${room._id}/beds`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Beds</Link>{canManageHostel(user) ? <Link to={`${basePath}/hostel-rooms/${room._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Room</Link> : null}</div> : null} />
      <AlertMessage tone="error" message={errorMessage} />
      {room ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{room.hostel?.hostelName || "-"}</p><h2 className="mt-2 text-2xl font-semibold text-ink">Floor {room.floorNumber}</h2></div><StatusBadge value={room.status} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(room.roomType)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Capacity</p><p className="mt-2 font-semibold text-ink">{room.capacity}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Occupied Beds</p><p className="mt-2 font-semibold text-ink">{room.occupiedBeds}</p></div></div></div> : null}
    </section>
  );
};

export default RoomDetailsPage;
