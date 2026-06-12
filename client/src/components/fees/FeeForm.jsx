import { FiCreditCard, FiDollarSign, FiFileText, FiLayers, FiUser } from "react-icons/fi";
import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { feeTypeOptions, paymentMethodOptions } from "../../utils/feeOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";
const sectionCardClass = "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const softPanelClass = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";

const getGroupLabel = (group) => group?.className || [group?.department, group?.course, group?.section].filter(Boolean).join(" - ") || "Academic Group";

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
  const selectedStudent = students.find((student) => student._id === formData.studentId);
  const selectedGroup = academicGroups.find((group) => group._id === formData.academicGroupId);

  return (
    <section className="space-y-6">
      <div
        className={`${sectionCardClass} overflow-hidden`}
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${settings.primaryColor}16, transparent 34%), radial-gradient(circle at bottom left, ${settings.secondaryColor}14, transparent 30%)`,
        }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700 dark:text-emerald-300">Finance Setup</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink dark:text-white">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Fee Type", value: formData.feeType || "tuition", icon: FiCreditCard },
              { label: "Amount", value: formData.amount || 0, icon: FiDollarSign },
              { label: "Status", value: formData.status || "pending", icon: FiFileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={softPanelClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                    <Icon className="text-slate-400" size={15} />
                  </div>
                  <p className="mt-3 text-base font-semibold capitalize text-ink dark:text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-ink dark:text-white">Fee Details</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assign the fee to a student, set amounts, and track payment details.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
                <select name="studentId" value={formData.studentId} onChange={onChange} className={inputClass} required>
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Group</label>
                <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}>
                  <option value="">Auto from student</option>
                  {academicGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {getGroupLabel(group)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fee Type</label>
                <select name="feeType" value={formData.feeType} onChange={onChange} className={inputClass}>
                  {feeTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input name="title" value={formData.title} onChange={onChange} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                <input type="number" min="0" name="amount" value={formData.amount} onChange={onChange} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Discount</label>
                <input type="number" min="0" name="discount" value={formData.discount} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fine</label>
                <input type="number" min="0" name="fine" value={formData.fine} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Paid Amount</label>
                <input type="number" min="0" name="paidAmount" value={formData.paidAmount} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={onChange} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Date</label>
                <input type="date" name="paymentDate" value={formData.paymentDate} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={onChange} className={inputClass}>
                  {paymentMethodOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Transaction ID</label>
                <input name="transactionId" value={formData.transactionId} onChange={onChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea name="description" value={formData.description} onChange={onChange} rows="4" className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Live Preview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the fee summary before saving it.</p>
            <div className="mt-6 grid gap-4">
              <div className={softPanelClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Student</p>
                <p className="mt-2 text-sm font-medium text-ink dark:text-white">{selectedStudent ? `${selectedStudent.name} (${selectedStudent.rollNumber})` : "Not selected"}</p>
              </div>
              <div className={softPanelClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Academic Group</p>
                <p className="mt-2 text-sm font-medium text-ink dark:text-white">{selectedGroup ? getGroupLabel(selectedGroup) : "Auto / not selected"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={softPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
                  <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.amount || 0}</p>
                </div>
                <div className={softPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Paid</p>
                  <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.paidAmount || 0}</p>
                </div>
              </div>
              <div className={softPanelClass}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    <FiUser size={16} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.studentId && formData.title ? "Fee record is ready to be created." : "Select student and title to complete the fee setup."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Save Fee</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Once values look correct, save this fee record.</p>
            <div className="mt-6 space-y-4">
              <AlertMessage tone="error" message={errorMessage} />
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                className="w-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Saving..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default FeeForm;
