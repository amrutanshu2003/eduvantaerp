import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getInstituteType } from "../../utils/instituteLabels";
import api from "../../api/axios";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

const AcademicGroupForm = ({ formData, onChange, onSubmit, submitting, errorMessage, title, description, institutes = [] }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [academicSettings, setAcademicSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchAcademicSettings();
  }, []);

  const fetchAcademicSettings = async () => {
    try {
      const { data } = await api.get("/settings/institute/academic");
      setAcademicSettings(data.academicSettings);
    } catch (error) {
      console.error("Failed to load academic settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  let instituteType = getInstituteType(user);
  if (user?.role === "superadmin" && formData.instituteId && institutes.length > 0) {
    const selectedInst = institutes.find((i) => i._id === formData.instituteId);
    if (selectedInst) {
      instituteType = selectedInst.instituteType;
    }
  }

  // Fallback to global settings if academic settings not loaded
  const ac = settings.academicConfig || {};
  const typeConfig = ac[instituteType] || {};

  // Get allowed levels based on academic settings or global settings
  const allowedSchoolLevels = academicSettings?.levels
    ?.filter((l) => l.status === "active")
    ?.map((l) => l.name) || typeConfig.allowedSchoolLevels || [];
  const allowedProgramLevels = academicSettings?.levels
    ?.filter((l) => l.status === "active")
    ?.map((l) => l.name) || typeConfig.allowedProgramLevels || [];

  // Get dynamic fields from academic settings
  const dynamicFields = academicSettings?.fields?.filter((f) => f.status === "active") || [];

  const hasSchoolLevels = allowedSchoolLevels.length > 0;
  const hasProgramLevels = allowedProgramLevels.length > 0;

  // Get labels from academic settings or use defaults
  const academicGroupLabel = academicSettings?.academicGroupLabel || "Class";
  const subGroupLabel = academicSettings?.subGroupLabel || "Section";

  const renderDynamicField = (field) => {
    const value = formData.dynamicFields?.[field.fieldKey] || formData[field.fieldKey] || "";

    const handleChange = (e) => {
      if (field.fieldKey in formData) {
        onChange(e);
      } else {
        onChange({
          target: {
            name: "dynamicFields",
            value: { ...formData.dynamicFields, [field.fieldKey]: e.target.value },
          },
        });
      }
    };

    if (field.type === "select") {
      return (
        <select
          name={field.fieldKey in formData ? field.fieldKey : undefined}
          value={value}
          onChange={handleChange}
          className={inputClass}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          name={field.fieldKey in formData ? field.fieldKey : undefined}
          value={value}
          onChange={handleChange}
          className={inputClass}
          required={field.required}
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          name={field.fieldKey in formData ? field.fieldKey : undefined}
          value={value}
          onChange={handleChange}
          className={inputClass}
          required={field.required}
        />
      );
    }

    return (
      <input
        type="text"
        name={field.fieldKey in formData ? field.fieldKey : undefined}
        value={value}
        onChange={handleChange}
        className={inputClass}
        required={field.required}
      />
    );
  };

  if (loadingSettings) {
    return <div className="flex items-center justify-center p-12">Loading settings...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
        <h1 className="text-3xl font-semibold text-ink dark:text-slate-200">{title}</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
        <div className="grid gap-5 md:grid-cols-2">
          {user?.role === "superadmin" && (
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Institute Connection</label>
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

          {/* Render dynamic fields */}
          {dynamicFields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div key={field.fieldKey}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {field.label}
                  {field.required && <span className="text-rose-500"> *</span>}
                </label>
                {renderDynamicField(field)}
              </div>
            ))}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
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
            {submitting ? "Saving..." : `Save ${academicGroupLabel}`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AcademicGroupForm;
