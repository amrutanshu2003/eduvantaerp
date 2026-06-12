import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select } from "../../components/ui";
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
          <Select
            name="relation"
            label="Relation"
            value={formData.relation}
            onChange={onChange}
          >
            <option value="">Select Relation</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="other">Other</option>
          </Select>
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
            <label className={`mb-2 block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Linked Students</label>
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
            <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hold Ctrl to select multiple students.</p>
          </div>
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

export default ParentForm;
