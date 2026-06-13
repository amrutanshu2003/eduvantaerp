import {
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiHash,
  FiLayers,
  FiPenTool,
  FiShield,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";

const sectionCardClass = "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const softPanelClass = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";
const statCardClass =
  "rounded-[1.25rem] border border-white/40 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/35";

const subjectTypeMeta = {
  core: "Foundation subject required for the academic group.",
  elective: "Optional subject offered as a choice to learners.",
  practical: "Hands-on subject focused on guided practice.",
  lab: "Lab-driven subject for experiments and applied learning.",
  project: "Project-based subject tied to outcomes and submissions.",
  research: "Advanced subject suited for investigation and reports.",
};

const subjectTypeTone = {
  core: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  elective: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  practical: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  lab: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  project: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  research: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const getInitials = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("") || "SB";

const renderField = ({ label, icon: Icon, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
        <Icon size={17} />
      </span>
      {children}
    </div>
  </div>
);

const getGroupLabel = (group) => group?.className || [group?.department, group?.course, group?.section].filter(Boolean).join(" - ") || "Academic Group";

const getTeacherLabel = (teacherId, teachers) => teachers.find((teacher) => teacher._id === teacherId)?.name || "Unassigned";

const SubjectForm = ({ title, description, formData, groups, teachers, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();
  const activeGroup = groups.find((group) => group._id === formData.academicGroupId);
  const selectedGroupLabel = getGroupLabel(activeGroup);
  const selectedTeacherLabel = getTeacherLabel(formData.teacherId, teachers);
  const readiness = formData.subjectName && formData.subjectCode && formData.academicGroupId;

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description}
      />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <FormSection title="Core Details" description="Define the subject identity, code, and academic group mapping.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Subject Name" required>
                <Input
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={onChange}
                  required
                />
              </FormField>
              <FormField label="Subject Code" required helperText="Unique identifier for the subject">
                <Input
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={onChange}
                  required
                  className="uppercase"
                />
              </FormField>
              <FormField label="Academic Group" required helperText="Select the academic group for this subject">
                <Select
                  name="academicGroupId"
                  value={formData.academicGroupId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select Academic Group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {getGroupLabel(group)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Teacher" helperText="Assign a teacher to this subject">
                <Select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={onChange}
                >
                  <option value="">Unassigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Assessment & Status" description="Control the subject format, activation state, and marks structure.">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Subject Type">
                <Select
                  name="subjectType"
                  value={formData.subjectType}
                  onChange={onChange}
                >
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="practical">Practical</option>
                  <option value="lab">Lab</option>
                  <option value="project">Project</option>
                  <option value="research">Research</option>
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
              <FormField label="Total Marks" helperText="Maximum marks for this subject">
                <Input
                  name="totalMarks"
                  type="number"
                  value={formData.totalMarks}
                  onChange={onChange}
                  min="0"
                />
              </FormField>
              <FormField label="Passing Marks" helperText="Minimum marks required to pass">
                <Input
                  name="passingMarks"
                  type="number"
                  value={formData.passingMarks}
                  onChange={onChange}
                  min="0"
                />
              </FormField>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Live Preview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the subject summary before saving it.</p>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
              <div
                className="px-5 py-5"
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor}22, ${settings.secondaryColor}12)`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-3xl text-lg font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                  >
                    {getInitials(formData.subjectName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Subject Preview</p>
                    <h3 className="mt-2 truncate text-xl font-semibold text-ink dark:text-white">{formData.subjectName || "Subject Name"}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {[formData.subjectCode || "CODE", formData.subjectType || "core"].join(" • ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Academic Group</p>
                    <p className="mt-2 text-sm font-medium text-ink dark:text-white">{selectedGroupLabel}</p>
                  </div>
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Teacher</p>
                    <p className="mt-2 text-sm font-medium text-ink dark:text-white">{selectedTeacherLabel}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Marks</p>
                    <p className="mt-2 text-sm font-medium text-ink dark:text-white">
                      {formData.passingMarks || 0} / {formData.totalMarks || 0} passing
                    </p>
                  </div>
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm font-medium capitalize text-ink dark:text-white">{formData.status || "active"}</p>
                  </div>
                </div>

                <div className={softPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Type Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {subjectTypeMeta[formData.subjectType] || subjectTypeMeta.core}
                  </p>
                </div>

                <div className={softPanelClass}>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${subjectTypeTone[formData.subjectType] || subjectTypeTone.core}`}>
                      {formData.subjectType}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {formData.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {readiness
                      ? "This subject is ready to be saved with its current academic mapping."
                      : "Add subject name, code, and academic group to complete the essential setup."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Save Subject</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Once details look right, save this subject to continue academic setup.</p>

            <div className="mt-6 space-y-4">
              <AlertMessage tone="error" message={errorMessage} />
              <FormActionBar
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel="Save Subject"
              />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default SubjectForm;
