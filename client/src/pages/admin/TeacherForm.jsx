import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select } from "../../components/ui";
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
            name="employeeId"
            label="Employee ID"
            value={formData.employeeId}
            onChange={onChange}
          />
          <Input
            name="qualification"
            label="Qualification"
            value={formData.qualification}
            onChange={onChange}
          />
          <Input
            name="experience"
            label="Experience"
            value={formData.experience}
            onChange={onChange}
          />
          <Input
            name="department"
            label="Department"
            value={formData.department}
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
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <Button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          >
            {submitting ? "Saving..." : `Save ${label}`}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default TeacherForm;
