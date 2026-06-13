import { useEffect, useMemo, useState } from "react";
import { FiBookmark, FiCheckCircle, FiGrid, FiHome, FiLayers, FiMapPin } from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import api from "../../api/axios";

const schoolFallbackLevels = ["Pre-Primary", "Primary", "Middle", "Secondary", "Higher Secondary"];
const collegeFallbackLevels = ["UG", "PG", "Diploma", "Certificate"];
const universityFallbackLevels = ["UG", "PG", "PhD", "Diploma", "Certificate"];
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";
const readOnlyClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200";
const cardClass = "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const softPanelClass = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";
const statCardClass =
  "rounded-[1.25rem] border border-white/40 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/35";

const AcademicGroupForm = ({
  formData,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
  fieldErrors = {},
  title,
  description,
  institutes = [],
  instituteType: resolvedInstituteType = "",
}) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [academicSettings, setAcademicSettings] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const fetchAcademicSettings = async () => {
      const shouldFetch = user?.role !== "superadmin" || formData.instituteId;
      if (!shouldFetch) {
        setAcademicSettings(null);
        setSettingsLoaded(true);
        return;
      }

      try {
        const requestConfig =
          user?.role === "superadmin" && formData.instituteId
            ? { headers: { "x-institute-id": formData.instituteId } }
            : undefined;
        const { data } = await api.get("/settings/institute/academic", requestConfig);
        setAcademicSettings(data.academicSettings || null);
      } catch {
        setAcademicSettings(null);
      } finally {
        setSettingsLoaded(true);
      }
    };

    fetchAcademicSettings();
  }, [formData.instituteId, user?.role]);

  const instituteType = resolvedInstituteType || formData.instituteType || user?.institute?.instituteType || "";

  const ac = settings.academicConfig || {};
  const typeConfig = ac[instituteType] || {};
  const dynamicFieldMap = useMemo(() => {
    const fields = academicSettings?.fields?.filter((field) => field.status === "active") || [];
    return fields.reduce((accumulator, field) => {
      accumulator[field.fieldKey] = field;
      return accumulator;
    }, {});
  }, [academicSettings]);

  const allowedSchoolLevels =
    academicSettings?.levels?.filter((level) => level.status === "active").map((level) => level.name) ||
    typeConfig.allowedSchoolLevels ||
    schoolFallbackLevels;

  const allowedProgramLevels = useMemo(() => {
    const configuredLevels = academicSettings?.levels?.filter((level) => level.status === "active").map((level) => level.name) || [];
    if (configuredLevels.length > 0) return configuredLevels;
    if (typeConfig.allowedProgramLevels?.length) return typeConfig.allowedProgramLevels;
    if (instituteType === "university") return universityFallbackLevels;
    if (instituteType === "college") return collegeFallbackLevels;
    return [];
  }, [academicSettings?.levels, instituteType, typeConfig.allowedProgramLevels]);

  const selectedInstitute =
    user?.role === "superadmin" ? institutes.find((inst) => inst._id === formData.instituteId) : user?.institute || null;

  const topErrorMessage =
    Object.values(fieldErrors).filter(Boolean).length > 0
      ? "Please complete required academic structure fields."
      : errorMessage;

  const previewText = useMemo(() => {
    if (!instituteType) return "Select an institute to configure academic groups.";
    if (instituteType === "school") {
      const parts = [formData.className, formData.section].filter(Boolean);
      return parts.length > 0 ? parts.join(" - ") : "Class preview will appear here.";
    }
    const parts = [formData.programLevel, formData.department, formData.course, formData.semester, formData.section].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Program preview will appear here.";
  }, [formData.className, formData.course, formData.department, formData.programLevel, formData.section, formData.semester, instituteType]);

  const previewChips = useMemo(() => {
    if (instituteType === "school") {
      return [formData.schoolLevel, formData.className, formData.section].filter(Boolean);
    }
    return [formData.programLevel, formData.department, formData.course, formData.semester, formData.year, formData.batch, formData.section].filter(Boolean);
  }, [formData.batch, formData.className, formData.course, formData.department, formData.programLevel, formData.schoolLevel, formData.section, formData.semester, formData.year, instituteType]);

  const fieldConfigMap = {
    schoolLevel: {
      label: dynamicFieldMap.schoolLevel?.label || "School Level",
      required: true,
      options: allowedSchoolLevels,
      placeholder: "Select School Level",
      type: "select",
    },
    className: {
      label: dynamicFieldMap.className?.label || "Class Name",
      required: true,
      placeholder: "e.g. Class 10",
      type: "text",
    },
    programLevel: {
      label: dynamicFieldMap.programLevel?.label || "Program Level",
      required: true,
      options: allowedProgramLevels,
      placeholder: "Select Program Level",
      type: "select",
    },
    department: {
      label: dynamicFieldMap.department?.label || "Department",
      required: true,
      placeholder: "e.g. Physics",
      type: "text",
    },
    course: {
      label: dynamicFieldMap.course?.label || "Course",
      required: true,
      placeholder: "e.g. M.Sc Physics",
      type: "text",
    },
    semester: {
      label: dynamicFieldMap.semester?.label || "Semester",
      required: false,
      placeholder: "e.g. Semester 1",
      type: "text",
    },
    year: {
      label: dynamicFieldMap.year?.label || "Year",
      required: false,
      placeholder: "e.g. 1st Year",
      type: "text",
    },
    batch: {
      label: dynamicFieldMap.batch?.label || "Batch",
      required: false,
      placeholder: "e.g. 2026-2028",
      type: "text",
    },
    section: {
      label: dynamicFieldMap.section?.label || "Section",
      required: true,
      placeholder: "e.g. A",
      type: "text",
    },
  };

  const structureFields =
    instituteType === "school"
      ? ["schoolLevel", "className", "section"]
      : instituteType === "college" || instituteType === "university"
        ? ["programLevel", "department", "course", "semester", "year", "batch", "section"]
        : [];

  const renderField = (fieldKey) => {
    const field = fieldConfigMap[fieldKey];
    if (!field) return null;

    const sharedLabel = (
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {field.label}
        {field.required ? <span className="text-rose-500"> *</span> : null}
      </label>
    );

    const helperError = fieldErrors[fieldKey] ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors[fieldKey]}</p> : null;

    if (field.type === "select") {
      return (
        <div key={fieldKey}>
          {sharedLabel}
          <select name={fieldKey} value={formData[fieldKey] || ""} onChange={onChange} className={inputClass}>
            <option value="">{field.placeholder}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {helperError}
        </div>
      );
    }

    return (
      <div key={fieldKey}>
        {sharedLabel}
        <input name={fieldKey} value={formData[fieldKey] || ""} onChange={onChange} placeholder={field.placeholder} className={inputClass} />
        {helperError}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        description={description}
      />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <FormSection title="Institute Connection" description="Choose the institute and verify the academic structure type.">
            <div className="grid gap-5 md:grid-cols-2">
              {user?.role === "superadmin" ? (
                <FormField label="Institute" required error={fieldErrors.instituteId}>
                  <Select
                    name="instituteId"
                    value={formData.instituteId}
                    onChange={onChange}
                    required
                  >
                    <option value="">Select Institute</option>
                    {institutes.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} ({inst.instituteCode}) - {inst.instituteType.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : (
                <>
                  <FormField label="Institute">
                    <div className={readOnlyClass}>{selectedInstitute?.name || "Linked institute"}</div>
                  </FormField>
                  <FormField label="Institute Type">
                    <div className={readOnlyClass}>{(instituteType || "Not available").toUpperCase()}</div>
                  </FormField>
                </>
              )}
            </div>
          </FormSection>

          <FormSection title="Academic Structure" description="Fields adapt automatically for school, college, or university structures.">
            {!instituteType ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                Select an institute to configure academic groups.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {structureFields.map((fieldKey) => {
                  const field = fieldConfigMap[fieldKey];
                  if (!field) return null;

                  if (field.type === "select") {
                    return (
                      <FormField key={fieldKey} label={field.label} required={field.required} error={fieldErrors[fieldKey]}>
                        <Select
                          name={fieldKey}
                          value={formData[fieldKey] || ""}
                          onChange={onChange}
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    );
                  }

                  return (
                    <FormField key={fieldKey} label={field.label} required={field.required} error={fieldErrors[fieldKey]}>
                      <Input
                        name={fieldKey}
                        value={formData[fieldKey] || ""}
                        onChange={onChange}
                        placeholder={field.placeholder}
                      />
                    </FormField>
                  );
                })}
              </div>
            )}
          </FormSection>

          <FormSection title="Status" description="Keep the academic group active to use it across students, subjects, and attendance.">
            <div className="grid gap-5 md:grid-cols-2">
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
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Preview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live academic group summary based on your current form values.</p>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
              <div
                className="px-5 py-5"
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor}22, ${settings.secondaryColor}12)`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-3xl text-white"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                  >
                    {instituteType === "school" ? <FiHome size={24} /> : <FiGrid size={24} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Academic Group Preview</p>
                    <p className="mt-2 text-xl font-semibold text-ink dark:text-slate-100">{previewText}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {selectedInstitute?.name || "Selected institute"} {instituteType ? `• ${instituteType}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Institute</p>
                    <p className="mt-2 text-sm font-medium text-ink dark:text-white">{selectedInstitute?.name || "Not selected"}</p>
                  </div>
                  <div className={softPanelClass}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm font-medium capitalize text-ink dark:text-white">{formData.status || "active"}</p>
                  </div>
                </div>

                <div className={softPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Structure Tokens</p>
                  {previewChips.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add structure fields to generate a cleaner preview summary.</p>
                  )}
                </div>

                <div className={softPanelClass}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      <FiMapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {previewChips.length > 0 ? "Structure details are taking shape and ready for validation." : "Start by selecting institute and filling structure details."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Submit</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Only required fields are validated before the request is sent.</p>
            <div className="mt-5 space-y-4">
              <AlertMessage tone="error" message={topErrorMessage} />
              <FormActionBar
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel="Save Academic Group"
              />
              {settingsLoaded && !academicSettings ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Academic settings were not available, so the form is using institute-type fallback fields.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default AcademicGroupForm;
