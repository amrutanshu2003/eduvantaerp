import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getTeacherLabel } from "../../utils/instituteLabels";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const TeacherForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const label = getTeacherLabel(user);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description.replaceAll("Teacher", label)}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Name</label><input name="name" value={formData.name} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Email</label><input name="email" type="email" value={formData.email} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><input name="phone" value={formData.phone} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Password</label><input name="password" type="password" value={formData.password} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Employee ID</label><input name="employeeId" value={formData.employeeId} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Qualification</label><input name="qualification" value={formData.qualification} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Experience</label><input name="experience" value={formData.experience} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Department</label><input name="department" value={formData.department} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : `Save ${label}`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TeacherForm;
