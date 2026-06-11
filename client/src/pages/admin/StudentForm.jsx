import { useState, useEffect } from "react";
import { FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import api from "../../api/axios";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

const StudentForm = ({
  formData,
  groups,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
  title,
  description,
  autoGenerate = false,
  onToggleAutoGenerate,
  isEmailManuallyEdited = false,
  isPasswordManuallyEdited = false,
}) => {
  const { settings, getButtonRadius } = useUISettings();
  const [showPassword, setShowPassword] = useState(false);
  const [academicSettings, setAcademicSettings] = useState(null);
  const [formSettings, setFormSettings] = useState(null);

  useEffect(() => {
    fetchAcademicSettings();
    fetchFormSettings();
  }, []);

  const fetchAcademicSettings = async () => {
    try {
      const { data } = await api.get("/settings/institute/academic");
      setAcademicSettings(data.academicSettings);
    } catch (error) {
      console.error("Failed to load academic settings:", error);
    }
  };

  const fetchFormSettings = async () => {
    try {
      const { data } = await api.get("/settings/institute/forms/student");
      setFormSettings(data.formSettings);
    } catch (error) {
      console.error("Failed to load form settings:", error);
    }
  };

  // Get labels from academic settings
  const academicGroupLabel = academicSettings?.academicGroupLabel || "Academic Group";
  const studentLabel = academicSettings?.studentLabel || "Student";

  // Get dynamic form fields from FormSettings
  const dynamicFormFields = formSettings?.fields?.filter((f) => f.showInForm && f.status === "active") || [];

  // Helper to render dynamic form field
  const renderDynamicField = (field) => {
    const value = formData[field.fieldKey] || "";

    if (field.type === "select") {
      return (
        <select
          name={field.fieldKey}
          value={value}
          onChange={onChange}
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
          name={field.fieldKey}
          value={value}
          onChange={onChange}
          className={inputClass}
          required={field.required}
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          name={field.fieldKey}
          value={value}
          onChange={onChange}
          className={inputClass}
          required={field.required}
          placeholder={field.placeholder}
        />
      );
    }

    // Default to text input
    return (
      <input
        type="text"
        name={field.fieldKey}
        value={value}
        onChange={onChange}
        className={inputClass}
        required={field.required}
        placeholder={field.placeholder}
      />
    );
  };

  const AutoBadge = ({ isEdited = false }) => {
    if (!autoGenerate) return null;
    if (isEdited) {
      return (
        <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
          Customized
        </span>
      );
    }
    return (
      <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Auto-filled
      </span>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      {onToggleAutoGenerate && (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all duration-300">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Smart Auto-Fill & Credentials Generation</h4>
              <p className="text-xs text-slate-600">
                Automatically calculate sequential Roll, Registration, and Admission numbers. Auto-generate email & passwords based on Name and Roll number.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={onToggleAutoGenerate}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            </label>
          </div>

          {autoGenerate && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/45 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Generated Credentials Preview</h4>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  Active
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-white p-3 flex items-center justify-between shadow-sm">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Email ID</span>
                    <span className="text-sm font-medium text-slate-800 break-all block">
                      {formData.email || <span className="text-slate-400 italic font-normal">Waiting for name...</span>}
                    </span>
                  </div>
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.email);
                        window.alert("Email copied to clipboard!");
                      }}
                      className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Copy Email"
                    >
                      <FiCopy className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white p-3 flex items-center justify-between shadow-sm">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Password</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-slate-800">
                        {showPassword ? formData.password || "••••••••" : "••••••••"}
                      </span>
                      {formData.password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.password);
                        window.alert("Password copied to clipboard!");
                      }}
                      className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Copy Password"
                    >
                      <FiCopy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <input name="name" value={formData.name} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
              <AutoBadge isEdited={isEmailManuallyEdited} />
            </label>
            <input name="email" type="email" value={formData.email} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input
              name="phone"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Phone number must be exactly 10 digits"
              value={formData.phone}
              onChange={onChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
              <AutoBadge isEdited={isPasswordManuallyEdited} />
            </label>
            <input name="password" type="password" value={formData.password} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{academicGroupLabel}</label>
            <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}>
              <option value="">Select {academicGroupLabel}</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.className || `${group.department} - ${group.course}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Roll Number
              {autoGenerate && (
                <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Auto-filled
                </span>
              )}
            </label>
            <input name="rollNumber" value={formData.rollNumber} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Admission Number
              {autoGenerate && (
                <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Auto-filled
                </span>
              )}
            </label>
            <input name="admissionNumber" value={formData.admissionNumber} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Registration Number
              {autoGenerate && (
                <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Auto-filled
                </span>
              )}
            </label>
            <input name="registrationNumber" value={formData.registrationNumber} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Date of Birth</label>
            <input name="dob" type="date" value={formData.dob} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
            <select name="gender" value={formData.gender} onChange={onChange} className={inputClass}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Blood Group</label>
            <input name="bloodGroup" value={formData.bloodGroup} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Admission Date
              {autoGenerate && (
                <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Auto-filled
                </span>
              )}
            </label>
            <input name="admissionDate" type="date" value={formData.admissionDate} onChange={onChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
            <textarea name="address" value={formData.address} onChange={onChange} rows="3" className={`${inputClass} resize-none`} />
          </div>
          {dynamicFormFields.map((field) => (
            <div key={field.fieldKey} className={field.type === "textarea" ? "md:col-span-2" : ""}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.fieldKey}
                  value={formData[field.fieldKey] || ""}
                  onChange={onChange}
                  rows="3"
                  className={`${inputClass} resize-none`}
                  required={field.required}
                  placeholder={field.placeholder}
                />
              ) : (
                renderDynamicField(field)
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white transition-all duration-300"
          >
            {submitting ? "Saving..." : `Save ${studentLabel}`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default StudentForm;
