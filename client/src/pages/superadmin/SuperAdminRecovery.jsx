import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useUISettings } from "../../context/UISettingsContext";

const initialFormState = {
  email: "",
  phone: "",
  newPassword: "",
  confirmPassword: "",
};

const SuperAdminRecovery = () => {
  const { settings, getButtonRadius, loading: settingsLoading } = useUISettings();
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

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/forgot-password", {
        role: "superadmin",
        email: formData.email,
        phone: formData.phone,
        newPassword: formData.newPassword,
      });

      setSuccessMessage(data.message || "Super Admin password reset successfully.");
      setFormData(initialFormState);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Verification failed. Please check the registered details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/95 p-8 shadow-card">
          <div className="space-y-4">
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8"
      style={
        settings.loginBackground
          ? {
              backgroundImage: `linear-gradient(rgba(2,6,23,0.84), rgba(2,6,23,0.84)), url(${settings.loginBackground})`,
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
            "radial-gradient(circle at top left, rgba(20,184,166,0.24), transparent 34%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-card backdrop-blur">
        <div
          className="px-6 py-7 text-white sm:px-8"
          style={{
            background: `linear-gradient(160deg, ${settings.sidebarColor} 0%, ${settings.primaryColor} 100%)`,
          }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-brand-100">Restricted Recovery</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Super Admin Access Reset</h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
            Use the registered Super Admin email and mobile number to reset access. Keep this page private and share it only with authorized owners.
          </p>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {successMessage ? (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div className="relative">
              <input
                id="superAdminRecoveryEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="peer h-14 w-full rounded-2xl border border-slate-200 px-4 pb-3 pt-5 text-base leading-6 outline-none transition focus:border-brand-600"
                placeholder=" "
                required
              />
              <label
                htmlFor="superAdminRecoveryEmail"
                className={`pointer-events-none absolute left-4 z-10 px-2 text-sm transition-all duration-200 ${
                  formData.email
                    ? "-top-2 translate-y-0 text-xs text-brand-700"
                    : "top-1/2 -translate-y-1/2 text-slate-400"
                } peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-700`}
              >
                Registered Super Admin Email
              </label>
            </div>

            <div className="relative">
              <input
                id="superAdminRecoveryPhone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="peer h-14 w-full rounded-2xl border border-slate-200 px-4 pb-3 pt-5 text-base leading-6 outline-none transition focus:border-brand-600"
                placeholder=" "
                required
              />
              <label
                htmlFor="superAdminRecoveryPhone"
                className={`pointer-events-none absolute left-4 z-10 px-2 text-sm transition-all duration-200 ${
                  formData.phone
                    ? "-top-2 translate-y-0 text-xs text-brand-700"
                    : "top-1/2 -translate-y-1/2 text-slate-400"
                } peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-700`}
              >
                Registered Super Admin Mobile Number
              </label>
            </div>

            <div className="relative">
              <input
                id="superAdminRecoveryPassword"
                name="newPassword"
                type={showPasswords ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                className="peer h-14 w-full rounded-2xl border border-slate-200 px-4 pb-3 pt-5 pr-14 text-base leading-6 outline-none transition focus:border-brand-600"
                placeholder=" "
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="superAdminRecoveryPassword"
                className={`pointer-events-none absolute left-4 z-10 px-2 text-sm transition-all duration-200 ${
                  formData.newPassword
                    ? "-top-2 translate-y-0 text-xs text-brand-700"
                    : "top-1/2 -translate-y-1/2 text-slate-400"
                } peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-700`}
              >
                New Password
              </label>
            </div>

            <div className="relative">
              <input
                id="superAdminRecoveryConfirmPassword"
                name="confirmPassword"
                type={showPasswords ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="peer h-14 w-full rounded-2xl border border-slate-200 px-4 pb-3 pt-5 pr-14 text-base leading-6 outline-none transition focus:border-brand-600"
                placeholder=" "
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="superAdminRecoveryConfirmPassword"
                className={`pointer-events-none absolute left-4 z-10 px-2 text-sm transition-all duration-200 ${
                  formData.confirmPassword
                    ? "-top-2 translate-y-0 text-xs text-brand-700"
                    : "top-1/2 -translate-y-1/2 text-slate-400"
                } peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-700`}
              >
                Confirm New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPasswords((current) => !current)}
                className="absolute inset-y-0 right-0 flex h-14 w-14 items-center justify-center text-slate-500 transition hover:text-slate-700"
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              >
                {showPasswords ? (
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.9 4.24A11.7 11.7 0 0112 4c6.36 0 10 8 10 8a17.6 17.6 0 01-1.67 2.68" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.61 6.61A17.3 17.3 0 002 12s3.64 8 10 8c1.9 0 3.67-.54 5.2-1.48" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting
                  ? `linear-gradient(110deg, ${settings.primaryColor} 15%, ${settings.secondaryColor} 50%, ${settings.primaryColor} 85%)`
                  : settings.primaryColor,
                backgroundSize: submitting ? "220% 100%" : undefined,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
              className="w-full px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {submitting ? "Resetting Access..." : "Reset Super Admin Password"}
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

export default SuperAdminRecovery;
