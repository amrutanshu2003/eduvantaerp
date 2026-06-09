import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getInstituteType } from "../../utils/instituteLabels";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const AcademicGroupForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description, institutes = [] }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  
  let instituteType = getInstituteType(user);
  if (user?.role === "superadmin" && formData.instituteId && institutes.length > 0) {
    const selectedInst = institutes.find((i) => i._id === formData.instituteId);
    if (selectedInst) {
      instituteType = selectedInst.instituteType;
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          {user?.role === "superadmin" && (
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Institute Connection</label>
              <select name="instituteId" value={formData.instituteId} onChange={onChange} className={inputClass} required>
                <option value="">Select Institute</option>
                {institutes.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.instituteCode}) - {inst.instituteType.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
          {instituteType === "school" ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">School Level</label>
                <select name="schoolLevel" value={formData.schoolLevel} onChange={onChange} className={inputClass}>
                  <option value="">Select School Level</option>
                  <option value="Pre-Primary">Pre-Primary</option>
                  <option value="Primary">Primary</option>
                  <option value="Middle">Middle</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Higher Secondary">Higher Secondary</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Class Name</label>
                <input name="className" value={formData.className} onChange={onChange} className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Program Level</label>
                <select name="programLevel" value={formData.programLevel} onChange={onChange} className={inputClass}>
                  <option value="">Select Program Level</option>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                  <option value="PhD">PhD</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                <input name="department" value={formData.department} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Course</label>
                <input name="course" value={formData.course} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Semester</label>
                <input name="semester" value={formData.semester} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
                <input name="year" value={formData.year} onChange={onChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Batch</label>
                <input name="batch" value={formData.batch} onChange={onChange} className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Section</label>
            <input name="section" value={formData.section} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
            {submitting ? "Saving..." : "Save Academic Group"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AcademicGroupForm;
