import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const SubjectForm = ({ title, description, formData, groups, teachers, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Subject Name</label><input name="subjectName" value={formData.subjectName} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Subject Code</label><input name="subjectCode" value={formData.subjectCode} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label><select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass} required><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Teacher</label><select name="teacherId" value={formData.teacherId} onChange={onChange} className={inputClass}><option value="">Unassigned</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Subject Type</label><select name="subjectType" value={formData.subjectType} onChange={onChange} className={inputClass}><option value="core">Core</option><option value="elective">Elective</option><option value="practical">Practical</option><option value="lab">Lab</option><option value="project">Project</option><option value="research">Research</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Total Marks</label><input name="totalMarks" type="number" value={formData.totalMarks} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Passing Marks</label><input name="passingMarks" type="number" value={formData.passingMarks} onChange={onChange} className={inputClass} /></div>
        </div>
        <div className="mt-6 space-y-4"><AlertMessage tone="error" message={errorMessage} /><button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Save Subject"}</button></div>
      </form>
    </section>
  );
};

export default SubjectForm;
