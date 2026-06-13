import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
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
      <form onSubmit={onSubmit}>
        <FormSection title="Basic Information">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={onChange}
                required
              />
            </FormField>
            <FormField label="Email" required helperText="Used for login">
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                required
              />
            </FormField>
            <FormField label="Phone" helperText="10 digit mobile number">
              <Input
                name="phone"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Phone number must be exactly 10 digits"
                value={formData.phone}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Password" helperText={formData.password ? "Leave blank to keep existing" : "Required for new accounts"}>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={onChange}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Professional Details">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Staff ID" required helperText="Unique identifier for staff member">
              <Input
                name="staffId"
                value={formData.staffId}
                onChange={onChange}
                required
              />
            </FormField>
            <FormField label="Designation">
              <Select
                name="designation"
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
            </FormField>
            <FormField label="Department">
              <Input
                name="department"
                value={formData.department}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Joining Date">
              <Input
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Salary" helperText="Monthly salary amount">
              <Input
                name="salary"
                type="number"
                value={formData.salary}
                onChange={onChange}
              />
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
          </div>
        </FormSection>

        <FormSection title="Additional Information">
          <FormField label="Address">
            <textarea
              name="address"
              value={formData.address}
              onChange={onChange}
              rows="3"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            />
          </FormField>
          <FormField label="Permissions" helperText="Comma-separated permissions">
            <textarea
              name="permissions"
              value={formData.permissions}
              onChange={onChange}
              rows="3"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            />
            <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Comma-separated values like `fees.manage, ui.customize`</p>
          </FormField>
        </FormSection>

        <FormSection>
          <div className="space-y-4">
            <AlertMessage tone="error" message={errorMessage} />
            <FormActionBar
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel="Save Staff"
            />
          </div>
        </FormSection>
      </form>
    </section>
  );
};

export default StaffForm;
