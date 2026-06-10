import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoginSkeleton from "../components/LoginSkeleton";
import { useUISettings } from "../context/UISettingsContext";

const initialFormState = {
  role: "admin",
  email: "",
  phone: "",
  recoveryKey: "",
  newPassword: "",
  confirmPassword: "",
};

const SecureAccountRecovery = () => {
  const { settings, loading, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState(initialFormState);
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.newPassword.trim().length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/secure-recovery", {
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        recoveryKey: formData.recoveryKey,
        newPassword: formData.newPassword,
      });

      setSuccessMessage(data.message || "Password reset successfully");
      setFormData(initialFormState);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Secure recovery failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoginSkeleton message="Loading secure recovery..." />;
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8"
      style={
        settings.loginBackground
          ? {
              backgroundImage: `linear-gradient(rgba(2,6,23,0.85), rgba(2,6,23,0.85)), url(${settings.loginBackground})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 36%), radial-gradient(circle at bottom right, rgba(245,158,11,0.14), transparent 28%)",
        }}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-card">
        <div
          className="px-6 py-7 text-white sm:px-8"
          style={{
            background: `linear-gradient(160deg, ${settings.sidebarColor} 0%, ${settings.primaryColor} 100%)`,
          }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-brand-100">Restricted Access</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Admin Recovery Portal</h1>
          <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
            This hidden page is only for Admin and Super Admin self-recovery. Use your registered contact details and the separate recovery key.
          </p>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {!settings.privilegedRecoveryEnabled ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              Secure recovery is currently disabled by Super Admin.
            </div>
          ) : null}

          {settings.privilegedRecoveryHint ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Recovery key hint: <span className="font-semibold text-slate-700">{settings.privilegedRecoveryHint}</span>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account Type</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                disabled={!settings.privilegedRecoveryEnabled}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Registered Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  disabled={!settings.privilegedRecoveryEnabled}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Registered Mobile Number</label>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  disabled={!settings.privilegedRecoveryEnabled}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Recovery Key</label>
              <input
                name="recoveryKey"
                type="password"
                value={formData.recoveryKey}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                disabled={!settings.privilegedRecoveryEnabled}
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                <input
                  name="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-400"
                  disabled={!settings.privilegedRecoveryEnabled}
                  required
                />
              </div>
              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-400"
                  disabled={!settings.privilegedRecoveryEnabled}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((current) => !current)}
                  className="absolute bottom-3 right-3 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                >
                  {showPasswords ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !settings.privilegedRecoveryEnabled}
              style={{
                backgroundColor: settings.primaryColor,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
              className="w-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Resetting..." : "Reset Securely"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm">
            <Link to="/login" className="font-medium text-slate-500 transition hover:text-slate-700">
              Back to Login
            </Link>
            <span className="text-slate-400">Hidden recovery route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureAccountRecovery;
