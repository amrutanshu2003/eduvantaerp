import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import api from "../../api/axios";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

const AcademicSettings = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState({
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
    studentLabel: "Student",
    levels: [],
    fields: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [loading, setLoading] = useState(true);

  // New level input
  const [newLevelName, setNewLevelName] = useState("");

  // New field input
  const [newField, setNewField] = useState({
    fieldKey: "",
    label: "",
    type: "text",
    required: false,
    options: "",
    showInList: false,
    order: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/academic-settings");
      setFormData(data.academicSettings);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load academic settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;
    const maxOrder = formData.levels.reduce((max, level) => Math.max(max, level.order), 0);
    setFormData((current) => ({
      ...current,
      levels: [...current.levels, { name: newLevelName.trim(), order: maxOrder + 1, status: "active" }],
    }));
    setNewLevelName("");
  };

  const handleRemoveLevel = (index) => {
    setFormData((current) => ({
      ...current,
      levels: current.levels.filter((_, i) => i !== index),
    }));
  };

  const handleToggleLevelStatus = (index) => {
    setFormData((current) => ({
      ...current,
      levels: current.levels.map((level, i) =>
        i === index ? { ...level, status: level.status === "active" ? "inactive" : "active" } : level
      ),
    }));
  };

  const handleAddField = () => {
    if (!newField.label.trim() || !newField.fieldKey.trim()) return;
    const maxOrder = formData.fields.reduce((max, field) => Math.max(max, field.order), 0);
    const fieldToAdd = {
      ...newField,
      fieldKey: newField.fieldKey.trim(),
      label: newField.label.trim(),
      options: newField.type === "select" ? newField.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
      order: maxOrder + 1,
      status: "active",
    };
    setFormData((current) => ({
      ...current,
      fields: [...current.fields, fieldToAdd],
    }));
    setNewField({
      fieldKey: "",
      label: "",
      type: "text",
      required: false,
      options: "",
      showInList: false,
      order: 0,
    });
  };

  const handleRemoveField = (index) => {
    setFormData((current) => ({
      ...current,
      fields: current.fields.filter((_, i) => i !== index),
    }));
  };

  const handleToggleFieldStatus = (index) => {
    setFormData((current) => ({
      ...current,
      fields: current.fields.map((field, i) =>
        i === index ? { ...field, status: field.status === "active" ? "inactive" : "active" } : field
      ),
    }));
  };

  const handleResetTemplate = async (template) => {
    try {
      setSubmitting(true);
      setMessage("");
      const { data } = await api.post("/academic-settings/reset-template", { template });
      setFormData(data.academicSettings);
      setMessageTone("success");
      setMessage(`Academic settings reset to ${template} template successfully`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to reset template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const { data } = await api.put("/academic-settings", formData);
      setFormData(data.academicSettings);
      setMessageTone("success");
      setMessage("Academic settings updated successfully");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update academic settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">Loading...</div>;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Academic Structure Settings"
        description="Customize academic labels, levels, and fields for your institute."
      />

      <AlertMessage tone={messageTone} message={message} />

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
        {/* Template Buttons */}
        <div className="mb-8 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Quick Templates</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleResetTemplate("school")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Use School Template
            </button>
            <button
              type="button"
              onClick={() => handleResetTemplate("college")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Use College Template
            </button>
            <button
              type="button"
              onClick={() => handleResetTemplate("university")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Use University Template
            </button>
          </div>
        </div>

        {/* Label Customization */}
        <div className="mb-8 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Label Customization</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Group Label</label>
              <input
                name="academicGroupLabel"
                value={formData.academicGroupLabel}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g., Class, Semester, Program"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Sub Group Label</label>
              <input
                name="subGroupLabel"
                value={formData.subGroupLabel}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g., Section, Batch"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Teacher Label</label>
              <input
                name="teacherLabel"
                value={formData.teacherLabel}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g., Teacher, Faculty"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Parent Label</label>
              <input
                name="parentLabel"
                value={formData.parentLabel}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g., Parent, Guardian"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Student Label</label>
              <input
                name="studentLabel"
                value={formData.studentLabel}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g., Student, Research Scholar"
              />
            </div>
          </div>
        </div>

        {/* Levels Management */}
        <div className="mb-8 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Academic Levels</h3>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newLevelName}
              onChange={(e) => setNewLevelName(e.target.value)}
              placeholder="Add new level (e.g., UG, PG, PhD)"
              className={`${inputClassName} flex-1`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLevel();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddLevel}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add Level
            </button>
          </div>
          <div className="space-y-2">
            {formData.levels.map((level, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${level.status === "active" ? "text-slate-800 dark:text-slate-200" : "text-slate-400 line-through"}`}>
                    {level.name}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Order: {level.order}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleLevelStatus(index)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {level.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveLevel(index)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Fields Builder */}
        <div className="mb-8 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Dynamic Fields</h3>
          <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Field Key</label>
              <input
                type="text"
                value={newField.fieldKey}
                onChange={(e) => setNewField({ ...newField, fieldKey: e.target.value })}
                placeholder="e.g., department, course"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Field Label</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., Department, Course"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className={inputClassName}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
                <option value="date">Date</option>
              </select>
            </div>
            {newField.type === "select" && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Options (comma-separated)</label>
                <input
                  type="text"
                  value={newField.options}
                  onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                  placeholder="e.g., Science, Arts, Commerce"
                  className={inputClassName}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Required
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newField.showInList}
                  onChange={(e) => setNewField({ ...newField, showInList: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Show in List
              </label>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddField}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add Field
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.fields.map((field, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-sm font-medium ${field.status === "active" ? "text-slate-800 dark:text-slate-200" : "text-slate-400 line-through"}`}>
                    {field.label}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {field.fieldKey}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      Required
                    </span>
                  )}
                  {field.showInList && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      List
                    </span>
                  )}
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Order: {field.order}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFieldStatus(index)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {field.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : "Save Academic Settings"}
        </button>
      </form>
    </section>
  );
};

export default AcademicSettings;
