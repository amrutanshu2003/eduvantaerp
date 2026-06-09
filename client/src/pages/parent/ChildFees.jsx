import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";

const ChildFees = () => {
  const { studentId } = useParams();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFees = async () => {
      try {
        const { data } = await api.get(`/fees/child/${studentId}`);
        setFees(data.fees || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load child fees");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, [studentId]);

  if (loading) return <LoadingBlock message="Loading child fees..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Parent"
        title={fees[0]?.studentId?.userId?.name ? `${fees[0].studentId.userId.name} Fees` : "Child Fees"}
        description="Review dues, paid amounts, and overdue items for your linked child."
      />
      <AlertMessage tone="error" message={errorMessage} />
      {fees.length === 0 ? (
        <EmptyState title="No fee records found" description="This child does not have any fee records yet." />
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

export default ChildFees;
