import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { canManageHostel, canViewHostel } from "../../utils/hostelAccess";

const BedDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [bed, setBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadBed = async () => {
      try {
        const { data } = await api.get(`/hostel-beds/${id}`);
        setBed(data.bed);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load bed details");
      } finally {
        setLoading(false);
      }
    };
    loadBed();
  }, [id]);

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel bed details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={bed?.bedNumber || "Bed Details"} description="Review hostel, room, and current bed status." actions={bed && canManageHostel(user) ? <Link to={`${basePath}/hostel-beds/${bed._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Bed</Link> : null} />
      <AlertMessage tone="error" message={errorMessage} />
      {bed ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{bed.hostel?.hostelName || "-"}</p><h2 className="mt-2 text-2xl font-semibold text-ink">Room {bed.room?.roomNumber || "-"}</h2></div><StatusBadge value={bed.status} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bed Number</p><p className="mt-2 font-semibold text-ink">{bed.bedNumber}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room Status</p><p className="mt-2 font-semibold text-ink">{bed.room?.status || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allocated Student</p><p className="mt-2 font-semibold text-ink">Next phase</p></div></div></div> : null}
    </section>
  );
};

export default BedDetailsPage;
