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

const HostelDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadHostel = async () => {
      try {
        const { data } = await api.get(`/hostels/${id}`);
        setHostel(data.hostel);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel details");
      } finally {
        setLoading(false);
      }
    };

    loadHostel();
  }, [id]);

  if (!canViewHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={hostel?.hostelName || "Hostel Details"}
        description="Review hostel code, type, floors, and warden details."
        actions={
          hostel ? (
            <div className="flex flex-wrap gap-3">
              <Link to={`${basePath}/hostels/${hostel._id}/rooms`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Rooms</Link>
              {canManageHostel(user) ? <Link to={`${basePath}/hostels/${hostel._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Hostel</Link> : null}
            </div>
          ) : null
        }
      />
      <AlertMessage tone="error" message={errorMessage} />
      {hostel ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{hostel.hostelCode}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{formatLabel(hostel.hostelType)}</h2>
            </div>
            <StatusBadge value={hostel.status} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden</p><p className="mt-2 font-semibold text-ink">{hostel.warden?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Floors</p><p className="mt-2 font-semibold text-ink">{hostel.totalFloors}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p><p className="mt-2 font-semibold text-ink">{hostel.contactNumber || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</p><p className="mt-2 font-semibold text-ink">{hostel.address || "-"}</p></div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default HostelDetailsPage;
