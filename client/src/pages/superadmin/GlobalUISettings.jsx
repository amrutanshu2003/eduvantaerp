import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import IconPicker from "../../components/ui/IconPicker";
import { useUISettings } from "../../context/UISettingsContext";
import { normalizeCustomSidebarItem, serializeCustomSidebarItem } from "../../utils/iconRegistry";

const ALL_SCHOOL_LEVELS = ["Pre-Primary", "Primary", "Middle", "Secondary", "Higher Secondary"];
const ALL_PROGRAM_LEVELS = ["UG", "PG", "PhD", "Diploma", "Certificate"];

const GlobalUISettings = () => {
  const { settings, updateGlobalSettings, refreshSettings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState(settings);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [clearRecoveryKey, setClearRecoveryKey] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [customFieldInput, setCustomFieldInput] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({ label: "", path: "", icon: null });

  useEffect(() => {
    setFormData({
      ...settings,
      customSidebarItems: Array.isArray(settings.customSidebarItems)
        ? settings.customSidebarItems.map(normalizeCustomSidebarItem)
        : [],
    });
    setRecoveryKey("");
    setClearRecoveryKey(false);
  }, [settings]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleToggleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.checked }));
  };

  const handleAcademicCheckbox = (instituteType, field, value, checked) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const prevList = prevType[field] || [];
      const nextList = checked ? [...prevList, value] : prevList.filter((v) => v !== value);
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [field]: nextList,
          },
        },
      };
    });
  };

  const handleAcademicNumber = (instituteType, field, value) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [field]: parseInt(value, 10) || 1,
          },
        },
      };
    });
  };

  const handleAddCustomField = (instituteType, field) => {
    if (!customFieldInput.trim()) return;
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const customFieldsKey = `${field}CustomFields`;
      const prevCustomFields = prevType[customFieldsKey] || [];
      if (prevCustomFields.includes(customFieldInput.trim())) return current;
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [customFieldsKey]: [...prevCustomFields, customFieldInput.trim()],
          },
        },
      };
    });
    setCustomFieldInput("");
  };

  const handleRemoveCustomField = (instituteType, field, value) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const customFieldsKey = `${field}CustomFields`;
      const prevCustomFields = prevType[customFieldsKey] || [];
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [customFieldsKey]: prevCustomFields.filter((v) => v !== value),
          },
        },
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await updateGlobalSettings({
        ...formData,
        customSidebarItems: (formData.customSidebarItems || []).map(serializeCustomSidebarItem),
        privilegedRecoveryKey: recoveryKey,
        clearPrivilegedRecoveryKey: clearRecoveryKey,
      });
      setMessageTone("success");
      setMessage("Global UI settings updated successfully");
      await refreshSettings();
      setRecoveryKey("");
      setClearRecoveryKey(false);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update UI settings");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

  const ac = formData.academicConfig || {};

  const togglePanel = (panel) => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  };

  const renderCheckboxGroup = (instituteType, field, allValues) => {
    const currentList = ac[instituteType]?.[field] || [];
    return (
      <div className="flex flex-wrap gap-3">
        {allValues.map((val) => {
          const isChecked = currentList.includes(val);
          return (
            <label
              key={val}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                isChecked
                  ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleAcademicCheckbox(instituteType, field, val, e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-all ${
                  isChecked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {isChecked && "✓"}
              </span>
              {val}
            </label>
          );
        })}
      </div>
    );
  };

  const renderCustomFields = (instituteType, field) => {
    const customFieldsKey = `${field}CustomFields`;
    const customFields = ac[instituteType]?.[customFieldsKey] || [];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {customFields.map((customField) => (
            <div
              key={customField}
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
            >
              {customField}
              <button
                type="button"
                onClick={() => handleRemoveCustomField(instituteType, field, customField)}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-indigo-600 hover:bg-indigo-300 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customFieldInput}
            onChange={(e) => setCustomFieldInput(e.target.value)}
            placeholder="Add custom field (e.g., Science, Arts)"
            className={`${inputClassName} flex-1`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomField(instituteType, field);
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleAddCustomField(instituteType, field)}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const handleAddCustomMenuItem = () => {
    if (!newMenuItem.label || !newMenuItem.path || !newMenuItem.icon) return;
    
    setFormData((current) => ({
      ...current,
      customSidebarItems: [...(current.customSidebarItems || []), normalizeCustomSidebarItem(newMenuItem)],
    }));
    setNewMenuItem({ label: "", path: "", icon: null });
  };

  const handleRemoveCustomMenuItem = (index) => {
    setFormData((current) => ({
      ...current,
      customSidebarItems: current.customSidebarItems?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleIconSelect = (icon) => {
    const normalizedIcon = {
      key: icon.key,
      name: icon.name,
      component: icon.component,
    };

    if (editingIconIndex !== null) {
      setFormData((current) => ({
        ...current,
        customSidebarItems: current.customSidebarItems?.map((item, i) =>
          i === editingIconIndex ? normalizeCustomSidebarItem({ ...item, iconKey: normalizedIcon.key }) : item
        ) || [],
      }));
      setEditingIconIndex(null);
    } else {
      setNewMenuItem((current) => ({ ...current, icon: normalizedIcon, iconKey: normalizedIcon.key }));
    }
    setIconPickerOpen(false);
  };

  const openIconPicker = (index = null) => {
    setEditingIconIndex(index);
    setIconPickerOpen(true);
  };

  const renderPanelHeader = (label, icon, panelKey, badgeCount) => {
    const isOpen = expandedPanel === panelKey;
    return (
      <button
        type="button"
        onClick={() => togglePanel(panelKey)}
        className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${formData.primaryColor}18`, color: formData.primaryColor }}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{badgeCount} level{badgeCount !== 1 ? "s" : ""} enabled</p>
          </div>
        </div>
        <span className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
    );
  };

  const schoolLevelsCount = (ac.school?.allowedSchoolLevels || []).length;
  const collegeLevelsCount = (ac.college?.allowedSchoolLevels || []).length + (ac.college?.allowedProgramLevels || []).length;
  const uniLevelsCount = (ac.university?.allowedProgramLevels || []).length;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Global UI Settings"
        description="Customize the shared application branding and theme values used across the ERP. Updating the app name here will refresh the brand name anywhere it is connected."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Institute / App Name</label>
              <input
                name="appName"
                value={formData.appName || ""}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Enter the ERP name to show across the app"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Change this once and every connected branding area like the login page, sidebar, navbar, admin dashboard, and browser tab title will use the new name.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
              <input name="logo" value={formData.logo || ""} onChange={handleChange} className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Primary Color</label>
              <input name="primaryColor" type="color" value={formData.primaryColor || "#0f766e"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Secondary Color</label>
              <input name="secondaryColor" type="color" value={formData.secondaryColor || "#f59e0b"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Sidebar Color</label>
              <input name="sidebarColor" type="color" value={formData.sidebarColor || "#0f172a"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Theme Mode</label>
              <select name="themeMode" value={formData.themeMode || "system"} onChange={handleChange} className={inputClassName}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Button Style</label>
              <select name="buttonStyle" value={formData.buttonStyle || "rounded"} onChange={handleChange} className={inputClassName}>
                <option value="rounded">Rounded</option>
                <option value="pill">Pill</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Login Background URL</label>
              <input name="loginBackground" value={formData.loginBackground || ""} onChange={handleChange} className={inputClassName} />
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Show Captcha On Login Page</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Turn this on if you want the login page to require captcha verification.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="captchaEnabled"
                    checked={Boolean(formData.captchaEnabled)}
                    onChange={handleToggleChange}
                    className="peer sr-only"
                  />
                  <span
                    className="h-7 w-14 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: formData.captchaEnabled ? formData.primaryColor : "#cbd5e1" }}
                  />
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.captchaEnabled ? "translate-x-7" : "translate-x-0"}`} />
                </label>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Secure Admin Recovery URL</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Let Admin and Super Admin recover their own password from a hidden URL using email, mobile number, and a separate recovery key.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="privilegedRecoveryEnabled"
                    checked={Boolean(formData.privilegedRecoveryEnabled)}
                    onChange={handleToggleChange}
                    className="peer sr-only"
                  />
                  <span
                    className="h-7 w-14 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: formData.privilegedRecoveryEnabled ? formData.primaryColor : "#cbd5e1" }}
                  />
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.privilegedRecoveryEnabled ? "translate-x-7" : "translate-x-0"}`} />
                </label>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Recovery Key Hint</label>
                  <input
                    name="privilegedRecoveryHint"
                    value={formData.privilegedRecoveryHint || ""}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Example: Owner recovery phrase"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Set New Recovery Key</label>
                  <input
                    type="password"
                    value={recoveryKey}
                    onChange={(event) => setRecoveryKey(event.target.value)}
                    className={inputClassName}
                    placeholder="Enter a separate secret recovery key"
                  />
                </div>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={clearRecoveryKey}
                  onChange={(event) => setClearRecoveryKey(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Clear existing recovery key and disable secure recovery
              </label>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Hidden recovery URLs: <span className="font-semibold text-slate-700">/secure/super-admin/recovery</span> and <span className="font-semibold text-slate-700">/secure/account-recovery</span>
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Footer Text</label>
              <textarea
                name="footerText"
                value={formData.footerText || ""}
                onChange={handleChange}
                rows="3"
                className={`${inputClassName} resize-none`}
              />
            </div>
          </div>

          {/* Academic Group Configuration */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Academic Group Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">
                Control which academic levels and options are available when creating academic groups for each institute type.
              </p>
            </div>

            <div className="space-y-3">
              {/* School Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("School", "🏫", "school", schoolLevelsCount)}
                {expandedPanel === "school" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed School Levels</p>
                      {renderCheckboxGroup("school", "allowedSchoolLevels", ALL_SCHOOL_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom School Levels</p>
                      {renderCustomFields("school", "allowedSchoolLevels")}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Max Class Number</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={ac.school?.maxClassNumber || 10}
                        onChange={(e) => handleAcademicNumber("school", "maxClassNumber", e.target.value)}
                        className={`${inputClassName} max-w-[160px]`}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Defines the maximum class number (e.g. 10 = Class 1 to Class 10)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* College Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("College", "🎓", "college", collegeLevelsCount)}
                {expandedPanel === "college" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed School Levels (for 11th / 12th)</p>
                      {renderCheckboxGroup("college", "allowedSchoolLevels", ALL_SCHOOL_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom School Levels</p>
                      {renderCustomFields("college", "allowedSchoolLevels")}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed Program Levels</p>
                      {renderCheckboxGroup("college", "allowedProgramLevels", ALL_PROGRAM_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom Program Levels</p>
                      {renderCustomFields("college", "allowedProgramLevels")}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Max Class Number</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={ac.college?.maxClassNumber || 12}
                        onChange={(e) => handleAcademicNumber("college", "maxClassNumber", e.target.value)}
                        className={`${inputClassName} max-w-[160px]`}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        For Higher Secondary classes (e.g. 12 = up to Class 12)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* University Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("University", "🏛️", "university", uniLevelsCount)}
                {expandedPanel === "university" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed Program Levels</p>
                      {renderCheckboxGroup("university", "allowedProgramLevels", ALL_PROGRAM_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom Program Levels</p>
                      {renderCustomFields("university", "allowedProgramLevels")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Customization */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Sidebar Customization</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add custom menu items to the sidebar with custom icons. These will appear in the sidebar for all users.
              </p>
            </div>

            <div className="space-y-4">
              {/* Add New Menu Item */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Add New Menu Item</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <input
                    type="text"
                    value={newMenuItem.label}
                    onChange={(e) => setNewMenuItem((current) => ({ ...current, label: e.target.value }))}
                    placeholder="Label (e.g., Reports)"
                    className={`${inputClassName}`}
                  />
                  <input
                    type="text"
                    value={newMenuItem.path}
                    onChange={(e) => setNewMenuItem((current) => ({ ...current, path: e.target.value }))}
                    placeholder="Path (e.g., /admin/reports)"
                    className={`${inputClassName}`}
                  />
                  <button
                    type="button"
                    onClick={() => openIconPicker(null)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      newMenuItem.icon
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {newMenuItem.icon ? (
                      <>
                        <newMenuItem.icon.component className="h-5 w-5" />
                        {newMenuItem.icon.name}
                      </>
                    ) : (
                      "Select Icon"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomMenuItem}
                    disabled={!newMenuItem.label || !newMenuItem.path || !newMenuItem.icon}
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Custom Menu Items List */}
              {formData.customSidebarItems && formData.customSidebarItems.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">Custom Menu Items</p>
                  <div className="space-y-2">
                    {formData.customSidebarItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <item.icon.component className="h-5 w-5 text-slate-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.path}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openIconPicker(index)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
                          title="Change Icon"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMenuItem(index)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-100 transition-colors"
                          title="Remove"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: formData.primaryColor, borderRadius: getButtonRadius(formData.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Global UI Settings"}
          </button>
        </form>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Preview</p>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div
              className="p-6 text-white"
              style={{
                background: formData.loginBackground
                  ? `linear-gradient(rgba(15,23,42,0.65), rgba(15,23,42,0.7)), url(${formData.loginBackground}) center/cover`
                  : `linear-gradient(160deg, ${formData.sidebarColor} 0%, ${formData.primaryColor} 100%)`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">{formData.appName}</p>
              <h3 className="mt-4 text-3xl font-semibold">Live Login Theme Preview</h3>
              <p className="mt-3 text-sm text-white/80">{formData.footerText}</p>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span>Captcha on login</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.captchaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.captchaEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span>Secure admin recovery</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.privilegedRecoveryEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.privilegedRecoveryEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: formData.primaryColor,
                  color: "#ffffff",
                  borderRadius: getButtonRadius(formData.buttonStyle),
                }}
                className="px-5 py-3 text-sm font-semibold"
              >
                Primary Button
              </button>
              <div className="flex gap-3">
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.primaryColor }} />
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.secondaryColor }} />
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.sidebarColor }} />
              </div>
            </div>
          </div>

          {/* Academic Config Preview */}
          <div className="mt-6 space-y-3">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Academic Config Preview</p>
            {[
              { label: "School", icon: "🏫", levels: ac.school?.allowedSchoolLevels || [], max: ac.school?.maxClassNumber },
              { label: "College", icon: "🎓", levels: [...(ac.college?.allowedSchoolLevels || []), ...(ac.college?.allowedProgramLevels || [])], max: ac.college?.maxClassNumber },
              { label: "University", icon: "🏛️", levels: ac.university?.allowedProgramLevels || [] },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.max && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Max Class {item.max}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.levels.length > 0 ? (
                    item.levels.map((l) => (
                      <span key={l} className="rounded-lg px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                        {l}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No levels enabled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {iconPickerOpen && (
        <IconPicker
          selectedIcon={editingIconIndex !== null ? formData.customSidebarItems?.[editingIconIndex]?.icon : newMenuItem.icon}
          onSelect={handleIconSelect}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </section>
  );
};

export default GlobalUISettings;
