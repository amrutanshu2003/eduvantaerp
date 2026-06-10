import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const GlobalUISettings = () => {
  const { settings, updateGlobalSettings, refreshSettings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState(settings);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleToggleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await updateGlobalSettings(formData);
      setMessageTone("success");
      setMessage("Global UI settings updated successfully");
      await refreshSettings();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update UI settings");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Global UI Settings"
        description="Customize the shared application branding and theme values used by the login page and dashboard shell."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">App Name</label>
              <input name="appName" value={formData.appName || ""} onChange={handleChange} className={inputClassName} />
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
        </div>
      </div>
    </section>
  );
};

export default GlobalUISettings;
