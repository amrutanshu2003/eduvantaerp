import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { feeTypeOptions, paymentMethodOptions } from "../../utils/feeOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const FeeForm = ({
  title,
  description,
  formData,
  students,
  academicGroups,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
  submitLabel = "Save Fee",
}) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
            <select name="studentId" value={formData.studentId} onChange={onChange} className={inputClass} required>
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.user?.name} ({student.rollNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label>
            <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}>
              <option value="">Auto from student</option>
              {academicGroups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Fee Type</label>
            <select name="feeType" value={formData.feeType} onChange={onChange} className={inputClass}>
              {feeTypeOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
            <input name="title" value={formData.title} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
            <input type="number" min="0" name="amount" value={formData.amount} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Discount</label>
            <input type="number" min="0" name="discount" value={formData.discount} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Fine</label>
            <input type="number" min="0" name="fine" value={formData.fine} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Paid Amount</label>
            <input type="number" min="0" name="paidAmount" value={formData.paidAmount} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
            <input type="date" name="dueDate" value={formData.dueDate} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Date</label>
            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={onChange} className={inputClass} />
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
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" value={formData.description} onChange={onChange} className={`${inputClass} min-h-28`} />
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
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
};

export default FeeForm;
