import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { noticeAudienceOptions, noticePriorityOptions, noticeStatusOptions, noticeTypeOptions } from "../../utils/noticeOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const NoticeForm = ({
  title,
  description,
  formData,
  academicGroups,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
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
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
            <input name="title" value={formData.title} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notice Type</label>
            <select name="noticeType" value={formData.noticeType} onChange={onChange} className={inputClass}>
              {noticeTypeOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Audience</label>
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
              <label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label>
              <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass} required>
                <option value="">Select Academic Group</option>
                {academicGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
            <select name="priority" value={formData.priority} onChange={onChange} className={inputClass}>
              {noticePriorityOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
              {noticeStatusOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Publish Date</label>
            <input type="date" name="publishDate" value={formData.publishDate} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={onChange} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" value={formData.description} onChange={onChange} className={`${inputClass} min-h-32`} required />
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
            {submitting ? "Saving..." : "Save Notice"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default NoticeForm;
