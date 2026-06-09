import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

const UserTransportPage = ({ role, childMode = false }) => {
  const { studentId } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadTransport = async () => {
      try {
        const endpoint = childMode ? `/transport/allocations/child/${studentId}` : "/transport/allocations/my-transport";
        const { data } = await api.get(endpoint);
        setAllocation(data.allocation || null);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load transport details");
      } finally {
        setLoading(false);
      }
    };

    loadTransport();
  }, [childMode, studentId]);

  if (loading) return <LoadingBlock message="Loading transport details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={role}
        title={childMode ? "Child Transport" : "My Transport"}
        description={childMode ? "Review the linked child's route, stop, and assigned vehicle details." : "Review your active transport route, stop, and fee details."}
      />
      <AlertMessage tone="error" message={errorMessage} />
      {!allocation ? (
        <EmptyState title="No transport allocation found" description="Transport details will appear once an active route allocation is assigned." />
      ) : (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{allocation.route?.routeName || "Transport Route"}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{allocation.stopName}</h2>
            </div>
            <StatusBadge value={allocation.status} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vehicle Number</p><p className="mt-2 font-semibold text-ink">{allocation.route?.vehicle?.vehicleNumber || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p><p className="mt-2 font-semibold text-ink">{allocation.route?.driver?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper</p><p className="mt-2 font-semibold text-ink">{allocation.route?.helper?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pickup Time</p><p className="mt-2 font-semibold text-ink">{allocation.pickupTime || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Drop Time</p><p className="mt-2 font-semibold text-ink">{allocation.dropTime || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Start Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.startDate)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Route Code</p><p className="mt-2 font-semibold text-ink">{allocation.route?.routeCode || "-"}</p></div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserTransportPage;
