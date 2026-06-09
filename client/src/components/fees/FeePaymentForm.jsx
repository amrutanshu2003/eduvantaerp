import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { paymentMethodOptions } from "../../utils/feeOptions";
import { formatCurrency, formatLabel } from "../../utils/formatters";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const FeePaymentForm = ({ fee, formData, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">Mark Fee Payment</h1>
        <p className="mt-3 text-sm text-slate-600">
          Record payment updates for {fee?.studentId?.userId?.name || "the selected student"}.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Payable</p>
            <p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee?.payableAmount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Already Paid</p>
            <p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(fee?.paidAmount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Status</p>
            <p className="mt-2 text-xl font-semibold text-ink">{formatLabel(fee?.status)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Paid Amount</label>
            <input type="number" min="0" name="paidAmount" value={formData.paidAmount} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Date</label>
            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={onChange} className={inputClass}>
              {paymentMethodOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Transaction ID</label>
            <input name="transactionId" value={formData.transactionId} onChange={onChange} className={inputClass} />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white"
          >
            {submitting ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default FeePaymentForm;
