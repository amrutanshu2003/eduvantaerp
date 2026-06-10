import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";

const FeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFee = async () => {
      try {
        const { data } = await api.get(`/fees/${id}`);
        setFee(data.fee);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load fee");
      } finally {
        setLoading(false);
      }
    };

    loadFee();
  }, [id]);

  const handleDelete = async () => {
    if (!(await window.confirm("Delete this fee?"))) return;

    try {
      await api.delete(`/fees/${id}`);
      window.alert("Fee deleted successfully");
      navigate("/admin/fees");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete fee");
    }
  };

  if (loading) return <LoadingBlock message="Loading fee details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={fee?.title || "Fee Details"}
        description="Review dues, payments, and student billing details."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/admin/fees/${id}/edit`}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Edit Fee
            </Link>
            <Link to={`/admin/fees/${id}/payment`} className="rounded-full border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700">
              Mark Payment
            </Link>
            <button type="button" onClick={handleDelete} className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">
              Delete
            </button>
          </div>
        }
      />

      <AlertMessage tone="error" message={errorMessage} />

      {fee ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={fee.status} />
            <StatusBadge value={fee.feeType} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student</p><p className="mt-2 font-semibold text-ink">{fee.studentId?.userId?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{fee.academicGroupId?.className || [fee.academicGroupId?.department, fee.academicGroupId?.course, fee.academicGroupId?.section].filter(Boolean).join(" - ") || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p><p className="mt-2 font-semibold text-ink">{formatDate(fee.dueDate)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payment Method</p><p className="mt-2 font-semibold text-ink">{formatLabel(fee.paymentMethod)}</p></div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Amount</p><p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee.amount)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Discount</p><p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee.discount)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fine</p><p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee.fine)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payable</p><p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee.payableAmount)}</p></div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid Amount</p><p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee.paidAmount)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transaction ID</p><p className="mt-2 text-xl font-semibold text-ink">{fee.transactionId || "-"}</p></div>
          </div>
          {fee.description ? <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{fee.description}</div> : null}
        </div>
      ) : null}
    </section>
  );
};

export default FeeDetails;
