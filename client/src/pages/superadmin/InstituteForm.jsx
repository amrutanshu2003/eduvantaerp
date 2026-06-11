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
              <option value="university">University</option>
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
            <input name="phone" maxLength={10} pattern="[0-9]{10}" title="Phone number must be exactly 10 digits" value={formData.phone} onChange={onChange} className={inputClassName} />
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
            <label className="mb-2 block text-sm font-medium text-slate-700">Logo</label>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Logo Preview"
                  className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 font-semibold text-xs border border-dashed border-slate-300">
                  No Logo
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      onChange({ target: { name: "logo", value: url } });
                    }
                  }}
                  className="hidden"
                  id="logo-upload-input"
                />
                <label
                  htmlFor="logo-upload-input"
                  className="inline-block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Upload Image
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Or URL:</span>
                  <input
                    name="logo"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo && !formData.logo.startsWith("blob:") ? formData.logo : ""}
                    onChange={onChange}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
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
