import { useEffect, useMemo, useState } from "react";
import { FiBookmark, FiCheckCircle, FiGrid, FiHome, FiLayers, FiMapPin } from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
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
      <div
        className={`${cardClass} overflow-hidden`}
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${settings.primaryColor}16, transparent 34%), radial-gradient(circle at bottom left, ${settings.secondaryColor}14, transparent 30%)`,
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700 dark:text-emerald-300">Academic Setup</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink dark:text-slate-100">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Structure", value: instituteType || "pending", icon: FiLayers },
              { label: "Status", value: formData.status || "active", icon: FiCheckCircle },
              { label: "Preview", value: previewChips.length || 0, icon: FiBookmark },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={statCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                    <Icon className="text-slate-400" size={15} />
                  </div>
                  <p className="mt-3 text-base font-semibold capitalize text-ink dark:text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className={cardClass}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Institute Connection</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the institute and verify the academic structure type.</p>
              </div>
              {instituteType ? (
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white dark:bg-slate-100 dark:text-slate-900">
                  {instituteType}
                </span>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {user?.role === "superadmin" ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Institute</label>
                  <select name="instituteId" value={formData.instituteId} onChange={onChange} className={inputClass} required>
                    <option value="">Select Institute</option>
                    {institutes.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} ({inst.instituteCode}) - {inst.instituteType.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.instituteId ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.instituteId}</p> : null}
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Institute</label>
                    <div className={readOnlyClass}>{selectedInstitute?.name || "Linked institute"}</div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Institute Type</label>
                    <div className={readOnlyClass}>{(instituteType || "Not available").toUpperCase()}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Academic Structure</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fields adapt automatically for school, college, or university structures.</p>
            </div>

            {!instituteType ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                Select an institute to configure academic groups.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">{structureFields.map(renderField)}</div>
            )}
          </div>

          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep the academic group active to use it across students, subjects, and attendance.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
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
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                className="w-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Academic Group"}
              </button>
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
