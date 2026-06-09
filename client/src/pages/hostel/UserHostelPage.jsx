import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

const UserHostelPage = ({ role, childMode = false }) => {
  const { studentId } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = childMode ? `/hostel-allocations/child/${studentId}` : "/hostel-allocations/my-hostel";
        const { data } = await api.get(endpoint);
        setAllocation(data.allocation || null);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childMode, studentId]);

  if (loading) return <LoadingBlock message="Loading hostel details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={role} title={childMode ? "Child Hostel" : "My Hostel"} description={childMode ? "Review the linked child's hostel room, bed, and warden details." : "Review your current hostel room, bed, warden, and hostel fee details."} />
      <AlertMessage tone="error" message={errorMessage} />
      {!allocation ? <EmptyState title="No hostel allocation found" description="Hostel allocation details will appear after an active room and bed assignment." /> : <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{allocation.hostel?.hostelName || "-"}</p><h2 className="mt-2 text-2xl font-semibold text-ink">Room {allocation.room?.roomNumber || "-"} • Bed {allocation.bed?.bedNumber || "-"}</h2></div><StatusBadge value={allocation.status} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden</p><p className="mt-2 font-semibold text-ink">{allocation.hostel?.warden?.name || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Security Deposit</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.securityDeposit)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allocation Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.allocationDate)}</p></div></div></div>}
    </section>
  );
};

export default UserHostelPage;
