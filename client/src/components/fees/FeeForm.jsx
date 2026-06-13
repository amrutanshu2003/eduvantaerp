import { FiCreditCard, FiDollarSign, FiFileText, FiLayers, FiUser } from "react-icons/fi";
import AlertMessage from "../AlertMessage";
import PageHeader from "../PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../ui";
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
      <PageHeader
        title={title}
        description={description}
      />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <FormSection title="Fee Details" description="Assign the fee to a student, set amounts, and track payment details.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Student" required>
                <Select
                  name="studentId"
                  value={formData.studentId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.rollNumber})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Academic Group" helperText="Optional override from student's group">
                <Select
                  name="academicGroupId"
                  value={formData.academicGroupId}
                  onChange={onChange}
                >
                  <option value="">Auto from student</option>
                  {academicGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {getGroupLabel(group)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Fee Type">
                <Select
                  name="feeType"
                  value={formData.feeType}
                  onChange={onChange}
                >
                  {feeTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Title" required>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Amount" required helperText="Total fee amount">
                <Input
                  name="amount"
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Discount" helperText="Optional discount amount">
                <Input
                  name="discount"
                  type="number"
                  min="0"
                  value={formData.discount}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Fine" helperText="Late payment fine">
                <Input
                  name="fine"
                  type="number"
                  min="0"
                  value={formData.fine}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Paid Amount" helperText="Amount already paid">
                <Input
                  name="paidAmount"
                  type="number"
                  min="0"
                  value={formData.paidAmount}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Due Date" required>
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Payment Date">
                <Input
                  name="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Payment Method">
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={onChange}
                >
                  {paymentMethodOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Transaction ID">
                <Input
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Description" className="md:col-span-2">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </FormField>
            </div>
          </FormSection>
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
              <FormActionBar
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel={submitLabel}
              />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default FeeForm;
