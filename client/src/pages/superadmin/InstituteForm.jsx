import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

const InstituteForm = ({ title, description, formData, onChange, onSubmit, submitting, errorMessage, submitLabel }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Institute Name</label>
            <input name="name" value={formData.name} onChange={onChange} className={inputClassName} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Institute Code</label>
            <input name="instituteCode" value={formData.instituteCode} onChange={onChange} className={inputClassName} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Institute Type</label>
            <select name="instituteType" value={formData.instituteType} onChange={onChange} className={inputClassName}>
              <option value="school">School</option>
              <option value="college">College</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Head Name</label>
            <input name="headName" value={formData.headName} onChange={onChange} className={inputClassName} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input name="email" type="email" value={formData.email} onChange={onChange} className={inputClassName} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" value={formData.phone} onChange={onChange} className={inputClassName} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Plan</label>
            <select name="plan" value={formData.plan} onChange={onChange} className={inputClassName}>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Status</label>
            <select name="paymentStatus" value={formData.paymentStatus} onChange={onChange} className={inputClassName}>
              <option value="trial">Trial</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" value={formData.status} onChange={onChange} className={inputClassName}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
            <input name="logo" value={formData.logo} onChange={onChange} className={inputClassName} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={onChange}
              rows="4"
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
};

export default InstituteForm;
