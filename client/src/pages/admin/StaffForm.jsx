import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const StaffForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description}
      />
      <form onSubmit={onSubmit} className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            name="name"
            label="Name"
            value={formData.name}
            onChange={onChange}
            required
          />
          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={onChange}
            required
          />
          <Input
            name="phone"
            label="Phone"
            maxLength={10}
            pattern="[0-9]{10}"
            title="Phone number must be exactly 10 digits"
            value={formData.phone}
            onChange={onChange}
          />
          <Input
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={onChange}
          />
          <Input
            name="staffId"
            label="Staff ID"
            value={formData.staffId}
            onChange={onChange}
            required
          />
          <Select
            name="designation"
            label="Designation"
            value={formData.designation}
            onChange={onChange}
          >
            <option value="">Select Designation</option>
            <option value="accountant">Accountant</option>
            <option value="librarian">Librarian</option>
            <option value="receptionist">Receptionist</option>
            <option value="security_guard">Security Guard</option>
            <option value="transport_staff">Transport Staff</option>
            <option value="driver">Driver</option>
            <option value="cleaner">Cleaner</option>
            <option value="peon">Peon</option>
            <option value="lab_assistant">Lab Assistant</option>
            <option value="hostel_warden">Hostel Warden</option>
            <option value="mess_manager">Mess Manager</option>
            <option value="hostel_security">Hostel Security</option>
            <option value="nurse">Nurse</option>
            <option value="exam_coordinator">Exam Coordinator</option>
          </Select>
          <Input
            name="department"
            label="Department"
            value={formData.department}
            onChange={onChange}
          />
          <Input
            name="joiningDate"
            label="Joining Date"
            type="date"
            value={formData.joiningDate}
            onChange={onChange}
          />
          <Input
            name="salary"
            label="Salary"
            type="number"
            value={formData.salary}
            onChange={onChange}
          />
          <Select
            name="status"
            label="Status"
            value={formData.status}
            onChange={onChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="md:col-span-2">
            <label className={`mb-2 block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={onChange}
              rows="3"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            />
          </div>
          <div className="md:col-span-2">
            <label className={`mb-2 block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Permissions</label>
            <textarea
              name="permissions"
              value={formData.permissions}
              onChange={onChange}
              rows="3"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            />
            <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Comma-separated values like `fees.manage, ui.customize`</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <Button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          >
            {submitting ? "Saving..." : "Save Staff"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default StaffForm;
