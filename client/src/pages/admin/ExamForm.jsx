import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ExamForm = ({ title, description, formData, groups, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();
  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><h1 className="text-3xl font-semibold text-ink">{title}</h1><p className="mt-3 text-sm text-slate-600">{description}</p></div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Exam Name</label><input name="examName" value={formData.examName} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Exam Type</label><select name="examType" value={formData.examType} onChange={onChange} className={inputClass}><option value="unit_test">Unit Test</option><option value="mid_term">Mid Term</option><option value="final">Final</option><option value="semester">Semester</option><option value="internal">Internal</option><option value="practical">Practical</option><option value="viva">Viva</option><option value="project">Project</option><option value="research_review">Research Review</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label><select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="published">Published</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label><input name="startDate" type="date" value={formData.startDate} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">End Date</label><input name="endDate" type="date" value={formData.endDate} onChange={onChange} className={inputClass} /></div>
        </div>
        <div className="mt-6 space-y-4"><AlertMessage tone="error" message={errorMessage} /><button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Save Exam"}</button></div>
      </form>
    </section>
  );
};

export default ExamForm;
