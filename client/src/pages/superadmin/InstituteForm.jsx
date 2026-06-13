import {
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiGlobe,
  FiHash,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";
const textAreaClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";

const sectionCardClass = "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const softPanelClass = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";
const statCardClass =
  "rounded-[1.25rem] border border-white/40 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/35";
const placeholderClassName = "text-sm font-medium text-slate-400 dark:text-slate-500";

const instituteTypeMeta = {
  school: {
    label: "School",
    description: "Best for K-12 campuses, day schools, and academic centers.",
  },
  college: {
    label: "College",
    description: "Designed for undergraduate and diploma-driven institutions.",
  },
  university: {
    label: "University",
    description: "Ideal for multi-program institutes with deeper administration.",
  },
};

const planTone = {
  free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  basic: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  premium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const paymentTone = {
  trial: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  expired: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const getInitials = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("") || "IN";

const renderField = ({ label, icon: Icon, children, required = false }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
        <Icon size={17} />
      </span>
      {children}
    </div>
  </div>
);

const InstituteForm = ({
  title,
  description,
  formData,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
  submitLabel,
  submittingLabel = "Saving...",
}) => {
  const { settings, getButtonRadius } = useUISettings();
  const instituteMeta = instituteTypeMeta[formData.instituteType] || instituteTypeMeta.school;
  const previewName = formData.name || "Institute Name";
  const previewCode = formData.instituteCode || "Not assigned";
  const hasHeadName = Boolean(formData.headName?.trim());
  const hasEmail = Boolean(formData.email?.trim());

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description}
      />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <FormSection title="Core Identity" description="Define the public-facing identity and leadership reference for this institute.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Institute Name" required>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Institute Code" required helperText="Unique identifier for the institute">
                <Input
                  name="instituteCode"
                  value={formData.instituteCode}
                  onChange={onChange}
                  required
                  className="uppercase"
                />
              </FormField>
              <FormField label="Institute Type" required>
                <Select
                  name="instituteType"
                  value={formData.instituteType}
                  onChange={onChange}
                  required
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                </Select>
              </FormField>
              <FormField label="Head Name" required helperText="Principal/Director name">
                <Input
                  name="headName"
                  value={formData.headName}
                  onChange={onChange}
                  required
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Contact & Branding" description="Add communication details, address, and institute logo for a polished setup.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Email" required helperText="Primary contact email">
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Phone" helperText="10 digit mobile number">
                <Input
                  name="phone"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Phone number must be exactly 10 digits"
                  value={formData.phone}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Logo" className="md:col-span-2">
                <div className={`${softPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center`}>
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Logo Preview"
                      className="h-20 w-20 rounded-3xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                      {getInitials(formData.name)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
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
                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <FiImage size={14} />
                        <span>Upload Logo</span>
                      </label>
                      <span className="text-xs text-slate-400">PNG, JPG or a public URL</span>
                    </div>

                    <div className="relative mt-3">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                        <FiImage size={16} />
                      </span>
                      <input
                        name="logo"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo && !formData.logo.startsWith("blob:") ? formData.logo : ""}
                        onChange={onChange}
                        className={`${inputClassName} pl-12`}
                      />
                    </div>
                  </div>
                </div>
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  rows="4"
                  className={`${textAreaClassName} resize-none`}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Subscription & Status" description="Control the commercial plan, payment standing, and operational status.">
            <div className="grid gap-5 md:grid-cols-3">
              <FormField label="Plan">
                <Select
                  name="plan"
                  value={formData.plan}
                  onChange={onChange}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </Select>
              </FormField>
              <FormField label="Payment Status">
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={onChange}
                >
                  <option value="trial">Trial</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="expired">Expired</option>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select
                  name="status"
                  value={formData.status}
                  onChange={onChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
            </div>
          </FormSection>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Live Preview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A quick summary of how this institute setup currently looks.</p>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
              <div
                className="px-5 py-5"
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor}22, ${settings.secondaryColor}12)`,
                }}
              >
                <div className="flex items-start gap-4">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Institute Logo"
                      className="h-[42px] w-[42px] rounded-full object-cover ring-2 ring-white/70 shadow-sm"
                    />
                  ) : (
                    <div
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] ring-1 ring-white/60"
                      style={{ background: `linear-gradient(145deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                    >
                      {getInitials(formData.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Institute Preview</p>
                    <h3 className="mt-2 truncate text-xl font-semibold text-ink dark:text-white">{previewName}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{[previewCode, instituteMeta.label].join(" / ")}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Head</p>
                    {hasHeadName ? (
                      <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.headName}</p>
                    ) : (
                      <p className={`mt-2 ${placeholderClassName}`}>Not assigned</p>
                    )}
                  </div>
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Contact</p>
                    {hasEmail ? (
                      <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.email}</p>
                    ) : (
                      <p className={`mt-2 ${placeholderClassName}`}>No email added</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${planTone[formData.plan] || planTone.free}`}>
                    {formData.plan}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${paymentTone[formData.paymentStatus] || paymentTone.trial}`}>
                    {formData.paymentStatus}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formData.status}
                  </span>
                </div>

                <div className={softPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Type Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{instituteMeta.description}</p>
                </div>

                <div className={softPanelClass}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Readiness Check</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {formData.name && formData.email && formData.headName
                          ? "Core setup details are ready. You can submit this institute now."
                          : "Add institute name, head name, and email to complete the key setup details."}
                      </p>
                    </div>
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                    >
                      <FiArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Submit</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the summary, then create the institute when ready.</p>

            <div className="mt-5 space-y-4">
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

export default InstituteForm;
