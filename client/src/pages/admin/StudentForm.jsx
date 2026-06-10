import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const StudentForm = ({ formData, groups, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Name</label><input name="name" value={formData.name} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Email</label><input name="email" type="email" value={formData.email} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><input name="phone" maxLength={10} pattern="[0-9]{10}" title="Phone number must be exactly 10 digits" value={formData.phone} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Password</label><input name="password" type="password" value={formData.password} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label><select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Roll Number</label><input name="rollNumber" value={formData.rollNumber} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Admission Number</label><input name="admissionNumber" value={formData.admissionNumber} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Registration Number</label><input name="registrationNumber" value={formData.registrationNumber} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Date of Birth</label><input name="dob" type="date" value={formData.dob} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Gender</label><select name="gender" value={formData.gender} onChange={onChange} className={inputClass}><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Blood Group</label><input name="bloodGroup" value={formData.bloodGroup} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Admission Date</label><input name="admissionDate" type="date" value={formData.admissionDate} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address</label><textarea name="address" value={formData.address} onChange={onChange} rows="3" className={`${inputClass} resize-none`} /></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Save Student"}</button>
        </div>
      </form>
    </section>
  );
};

export default StudentForm;
