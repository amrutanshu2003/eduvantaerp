import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFees = async () => {
      try {
        const { data } = await api.get("/fees/my-fees");
        setFees(data.fees || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load fees");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, []);

  const summary = useMemo(
    () => ({
      paid: fees.filter((fee) => fee.status === "paid").length,
      pending: fees.filter((fee) => ["unpaid", "partial", "overdue"].includes(fee.status)).length,
    }),
    [fees]
  );

  if (loading) return <LoadingBlock message="Loading your fees..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Student" title="My Fees" description="Review all paid, pending, and overdue fees assigned to your account." />
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pending Fees</p><p className="mt-3 text-3xl font-semibold text-ink">{summary.pending}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid Fees</p><p className="mt-3 text-3xl font-semibold text-ink">{summary.paid}</p></div>
      </div>
      {fees.length === 0 ? (
        <EmptyState title="No fees assigned" description="Your fee records will appear here when the admin creates them." />
      ) : (
        <div className="grid gap-4">
          {fees.map((fee) => (
            <article key={fee._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{fee.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formatLabel(fee.feeType)} fee</p>
                </div>
                <StatusBadge value={fee.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payable</p><p className="mt-2 font-semibold text-ink">{formatCurrency(fee.payableAmount)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid</p><p className="mt-2 font-semibold text-ink">{formatCurrency(fee.paidAmount)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p><p className="mt-2 font-semibold text-ink">{formatDate(fee.dueDate)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payment Method</p><p className="mt-2 font-semibold text-ink">{formatLabel(fee.paymentMethod)}</p></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Fees;
