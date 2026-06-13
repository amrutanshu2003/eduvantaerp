import { FiAlertCircle, FiCalendar, FiFileText, FiFlag, FiLayers } from "react-icons/fi";
import AlertMessage from "../AlertMessage";
import PageHeader from "../PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../ui";
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
      <PageHeader
        title={title}
        description={description}
      />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <FormSection title="Notice Details" description="Define the message type, target audience, schedule, and content.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Title" required className="md:col-span-2">
                <Input
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Notice Type">
                <Select
                  name="noticeType"
                  value={formData.noticeType}
                  onChange={onChange}
                >
                  {noticeTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Audience">
                <Select
                  name="audience"
                  value={formData.audience}
                  onChange={onChange}
                >
                  {noticeAudienceOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              {formData.audience === "academic_group" && (
                <FormField label="Academic Group" required>
                  <Select
                    name="academicGroupId"
                    value={formData.academicGroupId}
                    onChange={onChange}
                    required
                  >
                    <option value="">Select Academic Group</option>
                    {academicGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {getGroupLabel(group)}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
              <FormField label="Priority">
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={onChange}
                >
                  {noticePriorityOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Status">
                <Select
                  name="status"
                  value={formData.status}
                  onChange={onChange}
                >
                  {noticeStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Publish Date" required>
                <Input
                  name="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Expiry Date">
                <Input
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={onChange}
                />
              </FormField>
              <FormField label="Description" required className="md:col-span-2">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  rows="5"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </FormField>
            </div>
          </FormSection>
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
              <FormActionBar
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel="Save Notice"
              />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default NoticeForm;
