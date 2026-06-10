import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";

const AllocationDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadAllocation = async () => {
      try {
        const { data } = await api.get(`/transport/allocations/${id}`);
        setAllocation(data.allocation);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load allocation");
      } finally {
        setLoading(false);
      }
    };

    loadAllocation();
  }, [id]);

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading allocation details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={allocation?.student?.name || "Allocation Details"}
        description="Review allocated route, stop, timings, and transport fee for this student."
        actions={allocation ? <Link to={`${basePath}/allocations/${allocation._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Allocation</Link> : null}
      />
      <AlertMessage tone="error" message={errorMessage} />
      {allocation ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{allocation.route?.routeName || "-"}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{allocation.stopName}</h2>
            </div>
            <StatusBadge value={allocation.status} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student</p><p className="mt-2 font-semibold text-ink">{allocation.student?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vehicle</p><p className="mt-2 font-semibold text-ink">{allocation.route?.vehicle?.vehicleNumber || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p><p className="mt-2 font-semibold text-ink">{allocation.route?.driver?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper</p><p className="mt-2 font-semibold text-ink">{allocation.route?.helper?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pickup Time</p><p className="mt-2 font-semibold text-ink">{allocation.pickupTime || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Drop Time</p><p className="mt-2 font-semibold text-ink">{allocation.dropTime || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Start Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.startDate)}</p></div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AllocationDetailsPage;
