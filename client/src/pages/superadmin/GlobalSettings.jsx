import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

const GlobalSettings = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [activeTab, setActiveTab] = useState("branding");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  // ERP Settings State
  const [erpSettings, setErpSettings] = useState({
    appName: "Eduvanta ERP",
    appShortName: "Eduvanta",
    tagline: "Complete Institution Management System",
    logo: "",
    favicon: "",
    primaryColor: "#0f766e",
    secondaryColor: "#f59e0b",
    accentColor: "#3b82f6",
    sidebarColor: "#0f172a",
    navbarColor: "#ffffff",
    backgroundColor: "#f8fafc",
    cardColor: "#ffffff",
    textColor: "#1e293b",
    buttonStyle: "rounded",
    themeMode: "system",
    loginLayout: "split",
    loginBackground: "",
    loginHeroTitle: "Welcome Back",
    loginHeroSubtitle: "Sign in to access your dashboard",
    footerText: "© 2024 Eduvanta ERP. All rights reserved.",
    enableDarkMode: true,
    enableCaptcha: false,
    enableRememberMe: true,
    enableForgotPassword: true,
    defaultLanguage: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    currency: "USD",
    timezone: "UTC",
  });

  // Label Settings State
  const [labelSettings, setLabelSettings] = useState({
    labels: {
      instituteLabel: "Institute",
      academicGroupLabel: "Class",
      subGroupLabel: "Section",
      teacherLabel: "Teacher",
      parentLabel: "Parent",
      studentLabel: "Student",
      staffLabel: "Staff",
      subjectLabel: "Subject",
      examLabel: "Exam",
      resultLabel: "Result",
      feeLabel: "Fee",
      noticeLabel: "Notice",
      timetableLabel: "Timetable",
      assignmentLabel: "Assignment",
      libraryLabel: "Library",
      transportLabel: "Transport",
      hostelLabel: "Hostel",
      attendanceLabel: "Attendance",
      marksLabel: "Marks",
    },
  });

  // Module Settings State
  const [moduleSettings, setModuleSettings] = useState({
    modules: {
      academics: true,
      students: true,
      teachers: true,
      parents: true,
      staff: true,
      subjects: true,
      attendance: true,
      exams: true,
      marks: true,
      fees: true,
      notices: true,
      timetable: true,
      assignments: true,
      library: true,
      transport: true,
      hostel: true,
      payroll: false,
      reports: true,
    },
  });

  // Academic Settings State
  const [academicSettings, setAcademicSettings] = useState({
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
    studentLabel: "Student",
    levels: [],
    fields: [],
  });

  // Form Settings State
  const [formSettings, setFormSettings] = useState({
    entity: "student",
    fields: [],
  });
  const [selectedFormEntity, setSelectedFormEntity] = useState("student");

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const [erpRes, labelRes, moduleRes, academicRes] = await Promise.all([
        api.get("/settings/global/erp"),
        api.get("/settings/global/labels"),
        api.get("/settings/global/modules"),
        api.get("/settings/global/academic"),
      ]);

      if (erpRes.data.erpSettings) setErpSettings(erpRes.data.erpSettings);
      if (labelRes.data.labelSettings) setLabelSettings(labelRes.data.labelSettings);
      if (moduleRes.data.moduleSettings) setModuleSettings(moduleRes.data.moduleSettings);
      if (academicRes.data.academicSettings) setAcademicSettings(academicRes.data.academicSettings);
      
      // Fetch form settings for the selected entity
      await fetchFormSettings(selectedFormEntity);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const fetchFormSettings = async (entity) => {
    try {
      const { data } = await api.get(`/settings/global/forms/${entity}`);
      if (data.formSettings) setFormSettings(data.formSettings);
    } catch (error) {
      console.error("Failed to load form settings:", error);
    }
  };

  const handleSaveERPSettings = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.put("/settings/global/erp", erpSettings);
      setErpSettings(data.erpSettings);
      setMessageTone("success");
      setMessage("Global ERP settings updated successfully");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update ERP settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLabelSettings = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.put("/settings/global/labels", labelSettings);
      setLabelSettings(data.labelSettings);
      setMessageTone("success");
      setMessage("Global label settings updated successfully");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update label settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveModuleSettings = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.put("/settings/global/modules", moduleSettings);
      setModuleSettings(data.moduleSettings);
      setMessageTone("success");
      setMessage("Global module settings updated successfully");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update module settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetToDefaults = async (type) => {
    if (!window.confirm("Are you sure you want to reset to default settings?")) return;

    setSubmitting(true);
    setMessage("");
    try {
      if (type === "erp") {
        await api.post("/settings/global/erp/reset");
        await fetchAllSettings();
      } else if (type === "labels") {
        await api.post("/settings/global/labels/reset");
        await fetchAllSettings();
      } else if (type === "modules") {
        await api.post("/settings/global/modules/reset");
        await fetchAllSettings();
      }
      setMessageTone("success");
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} settings reset to defaults successfully`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to reset settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAcademicSettings = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.put("/settings/global/academic", academicSettings);
      setAcademicSettings(data.academicSettings);
      setMessageTone("success");
      setMessage("Global academic settings updated successfully");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update academic settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFormSettings = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.put(`/settings/global/forms/${selectedFormEntity}`, formSettings);
      setFormSettings(data.formSettings);
      setMessageTone("success");
      setMessage(`Global form settings for ${selectedFormEntity} updated successfully`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update form settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to apply the ${template} template?`)) return;

    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/settings/global/academic/reset", { template });
      await fetchAllSettings();
      setMessageTone("success");
      setMessage(`${template.charAt(0).toUpperCase() + template.slice(1)} template applied successfully`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to apply template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormEntityChange = async (entity) => {
    setSelectedFormEntity(entity);
    await fetchFormSettings(entity);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Global ERP Settings"
        description="Configure default branding, labels, and modules for all institutes."
      />

      <AlertMessage tone={messageTone} message={message} />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {["branding", "labels", "modules", "academic", "forms"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 outline-none ${
              activeTab === tab
                ? "border-slate-900 text-slate-900 dark:border-slate-200 dark:text-slate-200"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "branding" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveERPSettings(); }} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Branding & UI Settings</h3>
            <button
              type="button"
              onClick={() => handleResetToDefaults("erp")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">App Name</label>
              <input
                type="text"
                value={erpSettings.appName}
                onChange={(e) => setErpSettings({ ...erpSettings, appName: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">App Short Name</label>
              <input
                type="text"
                value={erpSettings.appShortName}
                onChange={(e) => setErpSettings({ ...erpSettings, appShortName: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tagline</label>
              <input
                type="text"
                value={erpSettings.tagline}
                onChange={(e) => setErpSettings({ ...erpSettings, tagline: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={erpSettings.primaryColor}
                  onChange={(e) => setErpSettings({ ...erpSettings, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-slate-200"
                />
                <input
                  type="text"
                  value={erpSettings.primaryColor}
                  onChange={(e) => setErpSettings({ ...erpSettings, primaryColor: e.target.value })}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={erpSettings.secondaryColor}
                  onChange={(e) => setErpSettings({ ...erpSettings, secondaryColor: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-slate-200"
                />
                <input
                  type="text"
                  value={erpSettings.secondaryColor}
                  onChange={(e) => setErpSettings({ ...erpSettings, secondaryColor: e.target.value })}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Button Style</label>
              <select
                value={erpSettings.buttonStyle}
                onChange={(e) => setErpSettings({ ...erpSettings, buttonStyle: e.target.value })}
                className={inputClassName}
              >
                <option value="rounded">Rounded</option>
                <option value="pill">Pill</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Theme Mode</label>
              <select
                value={erpSettings.themeMode}
                onChange={(e) => setErpSettings({ ...erpSettings, themeMode: e.target.value })}
                className={inputClassName}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Login Layout</label>
              <select
                value={erpSettings.loginLayout}
                onChange={(e) => setErpSettings({ ...erpSettings, loginLayout: e.target.value })}
                className={inputClassName}
              >
                <option value="split">Split</option>
                <option value="centered">Centered</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableDarkMode"
                checked={erpSettings.enableDarkMode}
                onChange={(e) => setErpSettings({ ...erpSettings, enableDarkMode: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="enableDarkMode" className="text-sm text-slate-700 dark:text-slate-300">Enable Dark Mode</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableCaptcha"
                checked={erpSettings.enableCaptcha}
                onChange={(e) => setErpSettings({ ...erpSettings, enableCaptcha: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="enableCaptcha" className="text-sm text-slate-700 dark:text-slate-300">Enable Captcha</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableRememberMe"
                checked={erpSettings.enableRememberMe}
                onChange={(e) => setErpSettings({ ...erpSettings, enableRememberMe: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="enableRememberMe" className="text-sm text-slate-700 dark:text-slate-300">Enable Remember Me</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableForgotPassword"
                checked={erpSettings.enableForgotPassword}
                onChange={(e) => setErpSettings({ ...erpSettings, enableForgotPassword: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="enableForgotPassword" className="text-sm text-slate-700 dark:text-slate-300">Enable Forgot Password</label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Branding Settings"}
          </button>
        </form>
      )}

      {activeTab === "labels" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveLabelSettings(); }} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Label Settings</h3>
            <button
              type="button"
              onClick={() => handleResetToDefaults("labels")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {Object.entries(labelSettings.labels).map(([key, value]) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setLabelSettings({
                    ...labelSettings,
                    labels: { ...labelSettings.labels, [key]: e.target.value }
                  })}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Label Settings"}
          </button>
        </form>
      )}

      {activeTab === "modules" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveModuleSettings(); }} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Module Settings</h3>
            <button
              type="button"
              onClick={() => handleResetToDefaults("modules")}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(moduleSettings.modules).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  id={key}
                  checked={value}
                  onChange={(e) => setModuleSettings({
                    ...moduleSettings,
                    modules: { ...moduleSettings.modules, [key]: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor={key} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Module Settings"}
          </button>
        </form>
      )}

      {activeTab === "academic" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAcademicSettings(); }} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Academic Structure Settings</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApplyTemplate("school")}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                School Template
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("college")}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                College Template
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("university")}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                University Template
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("minimal")}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Minimal Template
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 mb-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Group Label</label>
              <input
                type="text"
                value={academicSettings.academicGroupLabel}
                onChange={(e) => setAcademicSettings({ ...academicSettings, academicGroupLabel: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Sub-group Label</label>
              <input
                type="text"
                value={academicSettings.subGroupLabel}
                onChange={(e) => setAcademicSettings({ ...academicSettings, subGroupLabel: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Teacher Label</label>
              <input
                type="text"
                value={academicSettings.teacherLabel}
                onChange={(e) => setAcademicSettings({ ...academicSettings, teacherLabel: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Parent Label</label>
              <input
                type="text"
                value={academicSettings.parentLabel}
                onChange={(e) => setAcademicSettings({ ...academicSettings, parentLabel: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Student Label</label>
              <input
                type="text"
                value={academicSettings.studentLabel}
                onChange={(e) => setAcademicSettings({ ...academicSettings, studentLabel: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-3">Academic Levels</h4>
            <div className="space-y-2">
              {academicSettings.levels?.map((level, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={level.name}
                    onChange={(e) => {
                      const newLevels = [...academicSettings.levels];
                      newLevels[index].name = e.target.value;
                      setAcademicSettings({ ...academicSettings, levels: newLevels });
                    }}
                    className={`${inputClassName} flex-1`}
                    placeholder="Level name"
                  />
                  <input
                    type="number"
                    value={level.order}
                    onChange={(e) => {
                      const newLevels = [...academicSettings.levels];
                      newLevels[index].order = parseInt(e.target.value);
                      setAcademicSettings({ ...academicSettings, levels: newLevels });
                    }}
                    className={`${inputClassName} w-20`}
                    placeholder="Order"
                  />
                  <select
                    value={level.status}
                    onChange={(e) => {
                      const newLevels = [...academicSettings.levels];
                      newLevels[index].status = e.target.value;
                      setAcademicSettings({ ...academicSettings, levels: newLevels });
                    }}
                    className={inputClassName}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newLevels = academicSettings.levels.filter((_, i) => i !== index);
                      setAcademicSettings({ ...academicSettings, levels: newLevels });
                    }}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAcademicSettings({
                    ...academicSettings,
                    levels: [...academicSettings.levels, { name: "", order: academicSettings.levels.length, status: "active" }]
                  });
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Add Level
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Academic Settings"}
          </button>
        </form>
      )}

      {activeTab === "forms" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveFormSettings(); }} className="rounded-[1.75rem] bg-white p-6 shadow-card dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Form Field Settings</h3>
            <select
              value={selectedFormEntity}
              onChange={(e) => handleFormEntityChange(e.target.value)}
              className={inputClassName}
              style={{ width: "auto" }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="staff">Staff</option>
              <option value="fee">Fee</option>
              <option value="admission">Admission</option>
              <option value="hostel">Hostel</option>
              <option value="transport">Transport</option>
            </select>
          </div>

          <div className="space-y-4">
            {formSettings.fields?.map((field, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Field Key</label>
                    <input
                      type="text"
                      value={field.fieldKey}
                      onChange={(e) => {
                        const newFields = [...formSettings.fields];
                        newFields[index].fieldKey = e.target.value;
                        setFormSettings({ ...formSettings, fields: newFields });
                      }}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...formSettings.fields];
                        newFields[index].label = e.target.value;
                        setFormSettings({ ...formSettings, fields: newFields });
                      }}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const newFields = [...formSettings.fields];
                        newFields[index].type = e.target.value;
                        setFormSettings({ ...formSettings, fields: newFields });
                      }}
                      className={inputClassName}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                      <option value="textarea">Textarea</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Order</label>
                    <input
                      type="number"
                      value={field.order}
                      onChange={(e) => {
                        const newFields = [...formSettings.fields];
                        newFields[index].order = parseInt(e.target.value);
                        setFormSettings({ ...formSettings, fields: newFields });
                      }}
                      className={inputClassName}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => {
                          const newFields = [...formSettings.fields];
                          newFields[index].required = e.target.checked;
                          setFormSettings({ ...formSettings, fields: newFields });
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor={`required-${index}`} className="text-sm text-slate-700 dark:text-slate-300">Required</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`autoGenerate-${index}`}
                        checked={field.autoGenerate}
                        onChange={(e) => {
                          const newFields = [...formSettings.fields];
                          newFields[index].autoGenerate = e.target.checked;
                          setFormSettings({ ...formSettings, fields: newFields });
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor={`autoGenerate-${index}`} className="text-sm text-slate-700 dark:text-slate-300">Auto Generate</label>
                    </div>
                  </div>
                </div>
                {field.type === "select" && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Options (comma-separated)</label>
                    <input
                      type="text"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => {
                        const newFields = [...formSettings.fields];
                        newFields[index].options = e.target.value.split(",").map(o => o.trim());
                        setFormSettings({ ...formSettings, fields: newFields });
                      }}
                      className={inputClassName}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newFields = formSettings.fields.filter((_, i) => i !== index);
                      setFormSettings({ ...formSettings, fields: newFields });
                    }}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove Field
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormSettings({
                  ...formSettings,
                  fields: [...formSettings.fields, { fieldKey: "", label: "", type: "text", required: false, showInForm: true, showInList: false, order: formSettings.fields.length, autoGenerate: false }]
                });
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Add Field
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Form Settings"}
          </button>
        </form>
      )}
    </section>
  );
};

export default GlobalSettings;
