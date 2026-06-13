import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getParentLabel } from "../../utils/instituteLabels";

const ParentForm = ({ formData, students, onChange, onSubmit, submitting, errorMessage, title, description }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const label = getParentLabel(user);
  const isDark = resolvedTheme === "dark";

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description.replaceAll("Parent", label)}
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
            <FormField label="Relation">
              <Select
                name="relation"
                value={formData.relation}
                onChange={onChange}
              >
                <option value="">Select Relation</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </Select>
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

        <FormSection title="Student Linkage">
          <FormField label="Linked Students" helperText="Hold Ctrl to select multiple students">
            <select
              name="linkedStudentIds"
              value={formData.linkedStudentIds}
              onChange={onChange}
              multiple
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none h-40 ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            >
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} - {student.rollNumber}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Address">
            <textarea
              name="address"
              value={formData.address}
              onChange={onChange}
              rows="3"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700/50 text-white" : "border-slate-200 bg-white"}`}
            />
          </FormField>
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

export default ParentForm;
