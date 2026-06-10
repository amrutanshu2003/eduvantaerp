import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const AuditLogSettings = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [auditSettings, setAuditSettings] = useState({
    autoDeleteEnabled: false,
    retentionPeriod: "6months",
    customRetentionDays: 180,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [deleting, setDeleting] = useState(false);
  const [deleteDays, setDeleteDays] = useState(7);

  useEffect(() => {
    fetchAuditLogSettings();
  }, []);

  const fetchAuditLogSettings = async () => {
    try {
      const { data } = await api.get("/audit-logs/settings");
      setAuditSettings(data.settings);
    } catch (error) {
      console.error("Failed to fetch audit log settings:", error);
    }
  };

  const handleChange = (event) => {
    setAuditSettings((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleToggleChange = (event) => {
    setAuditSettings((current) => ({ ...current, [event.target.name]: event.target.checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await api.put("/audit-logs/settings", auditSettings);
      setMessageTone("success");
      setMessage("Audit log settings updated successfully");
      await fetchAuditLogSettings();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update audit log settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete all audit logs older than ${deleteDays} days? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const { data } = await api.post("/audit-logs/delete", { days: deleteDays });
      setMessageTone("success");
      setMessage(data.message);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Failed to delete audit logs");
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm("Are you sure you want to permanently delete ALL audit logs from the database? This action cannot be undone and will delete everything.")) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const { data } = await api.post("/audit-logs/delete", { clearAll: true });
      setMessageTone("success");
      setMessage(data.message);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Failed to clear audit logs");
    } finally {
      setDeleting(false);
    }
  };

  const handleRunAutoDelete = async () => {
    if (!window.confirm("Are you sure you want to run auto-delete now? This will delete audit logs based on your retention settings.")) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const { data } = await api.post("/audit-logs/auto-delete");
      setMessageTone("success");
      setMessage(data.message);
      await fetchAuditLogSettings();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Failed to run auto-delete");
    } finally {
      setDeleting(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

  const buttonStyle = {
    backgroundColor: settings.primaryColor,
    borderRadius: getButtonRadius(settings.buttonStyle),
  };

  const getRetentionDays = () => {
    switch (auditSettings.retentionPeriod) {
      case "3months":
        return 90;
      case "6months":
        return 180;
      case "1year":
        return 365;
      case "custom":
        return auditSettings.customRetentionDays;
      default:
        return 180;
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Audit Log Settings"
        description="Configure automatic deletion of audit logs to manage database storage. Set retention periods and manually clean up old logs as needed."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Auto-Delete</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Automatically delete audit logs older than the retention period every hour.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="autoDeleteEnabled"
                    checked={Boolean(auditSettings.autoDeleteEnabled)}
                    onChange={handleToggleChange}
                    className="peer sr-only"
                  />
                  <span
                    className="h-7 w-14 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: auditSettings.autoDeleteEnabled ? settings.primaryColor : "#cbd5e1" }}
                  />
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${auditSettings.autoDeleteEnabled ? "translate-x-7" : "translate-x-0"}`} />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Retention Period</label>
              <select
                name="retentionPeriod"
                value={auditSettings.retentionPeriod || "6months"}
                onChange={handleChange}
                className={inputClassName}
              >
                <option value="3months">3 Months (90 days)</option>
                <option value="6months">6 Months (180 days)</option>
                <option value="1year">1 Year (365 days)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {auditSettings.retentionPeriod === "custom" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Custom Retention Days</label>
                <input
                  name="customRetentionDays"
                  type="number"
                  min="7"
                  max="3650"
                  value={auditSettings.customRetentionDays || 180}
                  onChange={handleChange}
                  className={inputClassName}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter number of days (7-3650). Logs older than this will be deleted.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={buttonStyle}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Settings"}
          </button>
        </form>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Actions</p>
          
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Manual Delete</p>
              <p className="mt-1 text-sm text-slate-500">
                Permanently delete audit logs older than specified days.
              </p>
              <div className="mt-4 flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={deleteDays}
                  onChange={(e) => setDeleteDays(parseInt(e.target.value) || 7)}
                  className="w-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
                <span className="flex items-center text-sm text-slate-600">days</span>
              </div>
              <button
                type="button"
                onClick={handleManualDelete}
                disabled={deleting}
                className="mt-4 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? "Deleting..." : `Delete Logs Older Than ${deleteDays} Days`}
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-800">Clear All Logs</p>
              <p className="mt-1 text-sm text-slate-500">
                Permanently delete all audit logs from the database immediately.
              </p>
              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={deleting}
                className="btn-destructive-action mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm"
              >
                {deleting ? "Clearing..." : "Delete All Logs Permanently"}
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Run Auto-Delete Now</p>
              <p className="mt-1 text-sm text-slate-500">
                Manually trigger the auto-delete process based on current retention settings.
              </p>
              <button
                type="button"
                onClick={handleRunAutoDelete}
                disabled={deleting}
                style={buttonStyle}
                className="mt-4 w-full px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? "Running..." : "Run Auto-Delete Now"}
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Current Settings</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Auto-Delete:</span>
                  <span className={`font-semibold ${auditSettings.autoDeleteEnabled ? "text-emerald-600" : "text-slate-500"}`}>
                    {auditSettings.autoDeleteEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Retention Period:</span>
                  <span className="font-semibold text-slate-700">
                    {auditSettings.retentionPeriod === "custom" 
                      ? `${auditSettings.customRetentionDays} days` 
                      : auditSettings.retentionPeriod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Logs Will Be Deleted After:</span>
                  <span className="font-semibold text-slate-700">{getRetentionDays()} days</span>
                </div>
                {auditSettings.lastAutoDeleteRun && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Auto-Delete Run:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(auditSettings.lastAutoDeleteRun).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditLogSettings;
