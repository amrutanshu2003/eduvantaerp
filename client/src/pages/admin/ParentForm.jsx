import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getParentLabel } from "../../utils/instituteLabels";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ParentForm = ({ formData, students, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const label = getParentLabel(user);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description.replaceAll("Parent", label)}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Name</label><input name="name" value={formData.name} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Email</label><input name="email" type="email" value={formData.email} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><input name="phone" value={formData.phone} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Password</label><input name="password" type="password" value={formData.password} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Relation</label><select name="relation" value={formData.relation} onChange={onChange} className={inputClass}><option value="">Select Relation</option><option value="father">Father</option><option value="mother">Mother</option><option value="guardian">Guardian</option><option value="other">Other</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Linked Students</label><select name="linkedStudentIds" value={formData.linkedStudentIds} onChange={onChange} multiple className={`${inputClass} h-40`}>{students.map((student) => <option key={student._id} value={student._id}>{student.user?.name} - {student.rollNumber}</option>)}</select><p className="mt-2 text-xs text-slate-500">Hold Ctrl to select multiple students.</p></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address</label><textarea name="address" value={formData.address} onChange={onChange} rows="3" className={`${inputClass} resize-none`} /></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : `Save ${label}`}</button>
        </div>
      </form>
    </section>
  );
};

export default ParentForm;
