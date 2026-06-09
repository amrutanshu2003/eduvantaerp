import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const StaffForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description }) => {
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
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><input name="phone" value={formData.phone} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Password</label><input name="password" type="password" value={formData.password} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Staff ID</label><input name="staffId" value={formData.staffId} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Designation</label><select name="designation" value={formData.designation} onChange={onChange} className={inputClass}><option value="">Select Designation</option><option value="accountant">Accountant</option><option value="librarian">Librarian</option><option value="receptionist">Receptionist</option><option value="security_guard">Security Guard</option><option value="transport_staff">Transport Staff</option><option value="driver">Driver</option><option value="cleaner">Cleaner</option><option value="peon">Peon</option><option value="lab_assistant">Lab Assistant</option><option value="hostel_warden">Hostel Warden</option><option value="mess_manager">Mess Manager</option><option value="hostel_security">Hostel Security</option><option value="nurse">Nurse</option><option value="exam_coordinator">Exam Coordinator</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Department</label><input name="department" value={formData.department} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Joining Date</label><input name="joiningDate" type="date" value={formData.joiningDate} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Salary</label><input name="salary" type="number" value={formData.salary} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address</label><textarea name="address" value={formData.address} onChange={onChange} rows="3" className={`${inputClass} resize-none`} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Permissions</label><textarea name="permissions" value={formData.permissions} onChange={onChange} rows="3" className={`${inputClass} resize-none`} /><p className="mt-2 text-xs text-slate-500">Comma-separated values like `fees.manage, ui.customize`</p></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Save Staff"}</button>
        </div>
      </form>
    </section>
  );
};

export default StaffForm;
