import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getTeacherLabel } from "../../utils/instituteLabels";

const TeacherForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const label = getTeacherLabel(user);
  const isDark = resolvedTheme === "dark";

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description.replaceAll("Teacher", label)}
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
            <FormField label="Employee ID" helperText="Unique identifier for the teacher">
              <Input
                name="employeeId"
                value={formData.employeeId}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Qualification">
              <Input
                name="qualification"
                value={formData.qualification}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Experience" helperText="Years of experience">
              <Input
                name="experience"
                value={formData.experience}
                onChange={onChange}
              />
            </FormField>
            <FormField label="Department">
              <Input
                name="department"
                value={formData.department}
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

        <FormSection>
          <div className="space-y-4">
            <AlertMessage tone="error" message={errorMessage} />
            <FormActionBar
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel={`Save ${label}`}
            />
          </div>
        </FormSection>
      </form>
    </section>
  );
};

export default TeacherForm;
