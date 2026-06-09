import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { canManageHostel } from "../../utils/hostelAccess";

const HostelAllocationDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/hostel-allocations/${id}`);
        setAllocation(data.allocation);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel allocation");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel allocation details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={allocation?.student?.userId?.name || "Hostel Allocation"} description="Review the student's hostel, room, bed, and hostel fee details." actions={allocation ? <Link to={`${basePath}/hostel-allocations/${allocation._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Allocation</Link> : null} />
      <AlertMessage tone="error" message={errorMessage} />
      {allocation ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{allocation.hostel?.hostelName || "-"}</p><h2 className="mt-2 text-2xl font-semibold text-ink">Room {allocation.room?.roomNumber || "-"} • Bed {allocation.bed?.bedNumber || "-"}</h2></div><StatusBadge value={allocation.status} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allocation Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.allocationDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leaving Date</p><p className="mt-2 font-semibold text-ink">{formatDate(allocation.leavingDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.monthlyFee)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Security Deposit</p><p className="mt-2 font-semibold text-ink">{formatCurrency(allocation.securityDeposit)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden</p><p className="mt-2 font-semibold text-ink">{allocation.hostel?.warden?.name || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Remarks</p><p className="mt-2 font-semibold text-ink">{allocation.remarks || "-"}</p></div></div></div> : null}
    </section>
  );
};

export default HostelAllocationDetailsPage;
