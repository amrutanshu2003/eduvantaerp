import { useEffect, useState } from "react";
import api from "../api/axios";
import { useUISettings } from "../context/UISettingsContext";

const initialFormState = {
  newPassword: "",
  confirmPassword: "",
};

const UserPasswordResetModal = ({ open, onClose, targetId, targetRole, targetLabel, onSuccess }) => {
  const { settings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState(initialFormState);
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFormData(initialFormState);
      setShowPasswords(false);
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

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
      const { data } = await api.put("/auth/reset-managed-password", {
        targetId,
        targetRole,
        newPassword: formData.newPassword,
      });

      onSuccess?.(data.message || "Password updated successfully");
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Password Reset</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Set a new password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are updating the password for <span className="font-semibold text-slate-700">{targetLabel}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} autoComplete="off">
          <div className="relative">
            <input
              id="managedResetPassword"
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
              htmlFor="managedResetPassword"
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
              id="managedResetConfirmPassword"
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
              htmlFor="managedResetConfirmPassword"
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

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: settings.primaryColor,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
              className="px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {submitting ? "Updating..." : "Set New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPasswordResetModal;
