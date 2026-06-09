import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { assignmentStatusOptions, assignmentTypeOptions } from "../../utils/assignmentOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const AssignmentForm = ({ title, description, formData, academicGroups, subjects, onChange, onSubmit, submitting, errorMessage, showStatus = true }) => {
  const { settings, getButtonRadius } = useUISettings();
  const filteredSubjects = subjects.filter((subject) => !formData.academicGroupId || subject.academicGroupId?._id === formData.academicGroupId || subject.academicGroupId === formData.academicGroupId);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label>
            <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass} required>
              <option value="">Select Academic Group</option>
              {academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
            <select name="subjectId" value={formData.subjectId} onChange={onChange} className={inputClass} required>
              <option value="">Select Subject</option>
              {filteredSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
            <input name="title" value={formData.title} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
            <input type="date" name="dueDate" value={formData.dueDate} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Assignment Type</label>
            <select name="assignmentType" value={formData.assignmentType} onChange={onChange} className={inputClass}>
              {assignmentTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Max Marks</label>
            <input type="number" min="0" name="maxMarks" value={formData.maxMarks} onChange={onChange} className={inputClass} />
          </div>
          {showStatus ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
                {assignmentStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Attachment</label>
            <input name="attachment" value={formData.attachment} onChange={onChange} className={inputClass} placeholder="Optional URL or filename" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" value={formData.description} onChange={onChange} className={`${inputClass} min-h-32`} required />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AssignmentForm;
