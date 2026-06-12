import { FiAlertCircle, FiCalendar, FiFileText, FiFlag, FiLayers } from "react-icons/fi";
import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { noticeAudienceOptions, noticePriorityOptions, noticeStatusOptions, noticeTypeOptions } from "../../utils/noticeOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";
const sectionCardClass = "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const softPanelClass = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";

const getGroupLabel = (group) => group?.className || [group?.department, group?.course, group?.section].filter(Boolean).join(" - ") || "Academic Group";

const NoticeForm = ({ title, description, formData, academicGroups, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();
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
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700 dark:text-emerald-300">Communication Setup</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink dark:text-white">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Audience", value: formData.audience || "all", icon: FiLayers },
              { label: "Priority", value: formData.priority || "medium", icon: FiFlag },
              { label: "Status", value: formData.status || "draft", icon: FiAlertCircle },
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

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <div className={sectionCardClass}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-ink dark:text-white">Notice Details</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Define the message type, target audience, schedule, and content.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input name="title" value={formData.title} onChange={onChange} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Notice Type</label>
                <select name="noticeType" value={formData.noticeType} onChange={onChange} className={inputClass}>
                  {noticeTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
                <select name="audience" value={formData.audience} onChange={onChange} className={inputClass}>
                  {noticeAudienceOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              {formData.audience === "academic_group" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Group</label>
                  <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass} required>
                    <option value="">Select Academic Group</option>
                    {academicGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {getGroupLabel(group)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                <select name="priority" value={formData.priority} onChange={onChange} className={inputClass}>
                  {noticePriorityOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
                  {noticeStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Publish Date</label>
                <input type="date" name="publishDate" value={formData.publishDate} onChange={onChange} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={onChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea name="description" value={formData.description} onChange={onChange} rows="5" className={`${inputClass} resize-none`} required />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Live Preview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the notice summary before publishing or saving it.</p>
            <div className="mt-6 grid gap-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
                <div
                  className="px-5 py-5"
                  style={{ background: `linear-gradient(135deg, ${settings.primaryColor}22, ${settings.secondaryColor}12)` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-3xl text-white"
                      style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                    >
                      <FiFileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Notice Preview</p>
                      <p className="mt-2 text-xl font-semibold text-ink dark:text-white">{formData.title || "Notice Title"}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formData.noticeType || "general"} • {formData.priority || "medium"}</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 p-5">
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Audience</p>
                    <p className="mt-2 text-sm font-medium text-ink dark:text-white">
                      {formData.audience === "academic_group" ? selectedGroup ? getGroupLabel(selectedGroup) : "Academic group not selected" : formatLabel(formData.audience || "all")}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={softPanelClass}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Publish</p>
                      <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.publishDate || "Not set"}</p>
                    </div>
                    <div className={softPanelClass}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Expiry</p>
                      <p className="mt-2 text-sm font-medium text-ink dark:text-white">{formData.expiryDate || "Not set"}</p>
                    </div>
                  </div>
                  <div className={softPanelClass}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        <FiCalendar size={16} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {formData.title && formData.publishDate ? "Notice is ready for review and publishing." : "Add title and publish date to complete the notice setup."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Save Notice</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Once details look right, save the notice and continue publishing flow.</p>
            <div className="mt-6 space-y-4">
              <AlertMessage tone="error" message={errorMessage} />
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                className="w-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Notice"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default NoticeForm;
