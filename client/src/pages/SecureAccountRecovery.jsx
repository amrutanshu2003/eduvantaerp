import { useEffect, useRef, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import SecureRecoverySkeleton from "../components/SecureRecoverySkeleton";
import { useUISettings } from "../context/UISettingsContext";
import useBranding from "../hooks/useBranding";

const initialFormState = {
  role: "admin",
  email: "",
  phone: "",
  recoveryKey: "",
  newPassword: "",
  confirmPassword: "",
};

const SecureAccountRecovery = () => {
  const { settings, loading, getButtonRadius, resolvedTheme, toggleTheme } = useUISettings();
  const branding = useBranding();
  const recoveryCardRef = useRef(null);
  const themeToggleRef = useRef(null);
  const [formData, setFormData] = useState(initialFormState);
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [themeReveal, setThemeReveal] = useState(null);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!themeReveal) {
      return undefined;
    }

    const cleanupTimer = window.setTimeout(() => {
      setThemeReveal(null);
    }, themeReveal.duration);

    return () => window.clearTimeout(cleanupTimer);
  }, [themeReveal]);

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
      setShowRecoveryKey(false);
      setShowPasswords(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Secure recovery failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SecureRecoverySkeleton message="Loading secure recovery..." />;
  }

  const recoveryPanelSurfaceColor = "color-mix(in srgb, var(--theme-surface-strong) 97%, transparent)";

  const handleThemeToggle = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      toggleTheme();
      return;
    }

    const rect = themeToggleRef.current?.getBoundingClientRect();
    const cardRect = recoveryCardRef.current?.getBoundingClientRect();
    const originX = rect && cardRect ? rect.left - cardRect.left + rect.width / 2 : 40;
    const originY = rect && cardRect ? rect.top - cardRect.top + rect.height / 2 : 40;
    const maxRadius = Math.hypot(
      Math.max(originX, (cardRect?.width || 0) - originX),
      Math.max(originY, (cardRect?.height || 0) - originY)
    );

    setThemeReveal({
      x: originX,
      y: originY,
      startRadius: isDark ? maxRadius : 0,
      endRadius: isDark ? 0 : maxRadius,
      duration: isDark ? 700 : 760,
      direction: isDark ? "collapse" : "expand",
      overlayTheme: isDark ? "dark" : "dark",
    });

    window.setTimeout(() => {
      toggleTheme();
    }, isDark ? 30 : 300);
  };

  return (
    <div
      className="relative flex min-h-screen items-start justify-center overflow-y-auto overflow-x-hidden bg-slate-950 px-4 py-6 md:py-8 lg:pt-10 lg:pb-8"
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
      <style>
        {`
          @keyframes recovery-theme-expand {
            0% {
              clip-path: circle(var(--theme-start-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 0.24;
              transform: scale(0.88);
              filter: saturate(1.12);
            }
            55% {
              opacity: 0.92;
              transform: scale(1.02);
              filter: saturate(1.04);
            }
            100% {
              clip-path: circle(var(--theme-end-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 1;
              transform: scale(1);
              filter: saturate(1);
            }
          }
          @keyframes recovery-theme-collapse {
            0% {
              clip-path: circle(var(--theme-start-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 1;
              transform: scale(1);
              filter: saturate(1);
            }
            38% {
              opacity: 0.96;
              transform: scale(0.985);
              filter: saturate(1.04);
            }
            100% {
              clip-path: circle(var(--theme-end-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 0.16;
              transform: scale(0.64);
              filter: saturate(1.12);
            }
          }
          @keyframes recovery-theme-icon-bloom {
            0% { transform: scale(1) rotate(0deg); }
            35% { transform: scale(0.88) rotate(-10deg); }
            100% { transform: scale(1.08) rotate(10deg); }
          }
          @keyframes recovery-theme-icon-dock {
            0% { transform: scale(1) rotate(0deg); }
            40% { transform: scale(1.08) rotate(8deg); }
            100% { transform: scale(0.86) rotate(-10deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .recovery-theme-surface {
              transition: none !important;
            }
          }
        `}
      </style>

      <div
        ref={recoveryCardRef}
        className="recovery-theme-surface relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-card transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: recoveryPanelSurfaceColor }}
      >
        {themeReveal ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30"
            style={{
              background:
                themeReveal.overlayTheme === "dark"
                  ? "radial-gradient(circle at top, rgba(20,184,166,0.16), transparent 34%), linear-gradient(180deg, #08111f 0%, #0b1324 100%)"
                  : "radial-gradient(circle at top, rgba(20,184,166,0.12), transparent 38%), linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
              "--theme-origin-x": `${themeReveal.x}px`,
              "--theme-origin-y": `${themeReveal.y}px`,
              "--theme-start-radius": `${themeReveal.startRadius}px`,
              "--theme-end-radius": `${themeReveal.endRadius}px`,
              clipPath: `circle(${themeReveal.startRadius}px at ${themeReveal.x}px ${themeReveal.y}px)`,
              animation: `${themeReveal.direction === "expand" ? "recovery-theme-expand" : "recovery-theme-collapse"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              transformOrigin: `${themeReveal.x}px ${themeReveal.y}px`,
            }}
          />
        ) : null}

        <div
          className="recovery-theme-surface relative px-6 py-7 text-white transition-colors duration-500 ease-in-out sm:px-8"
          style={{
            background: `linear-gradient(160deg, ${settings.sidebarColor} 0%, ${settings.primaryColor} 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandMark
                appName={branding.appName}
                logo={branding.logo}
                size="md"
                className="bg-white/12 ring-white/20"
                imageClassName="p-1.5"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-100">{branding.appName}</p>
                <p className="mt-1 text-xs text-white/70">Restricted Access</p>
              </div>
            </div>
            <button
              ref={themeToggleRef}
              type="button"
              onClick={handleThemeToggle}
              className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-500 ease-in-out hover:scale-105 hover:rotate-6"
              style={{
                backgroundColor: isDark
                  ? "color-mix(in srgb, var(--theme-surface-strong) 88%, transparent)"
                  : "color-mix(in srgb, #ffffff 94%, #f8fafc 6%)",
                borderColor: isDark ? "var(--theme-border)" : "rgba(148, 163, 184, 0.4)",
                color: "var(--theme-text-soft)",
                boxShadow: isDark
                  ? "0 10px 24px rgba(2, 6, 23, 0.22)"
                  : "0 12px 28px rgba(148, 163, 184, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.82) inset",
              }}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span
                className="flex items-center justify-center"
                style={
                  themeReveal
                    ? {
                        animation: `${themeReveal.direction === "expand" ? "recovery-theme-icon-bloom" : "recovery-theme-icon-dock"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                      }
                    : undefined
                }
              >
                {isDark ? <FiMoon className="h-5 w-5 text-slate-200" /> : <FiSun className="h-[1.35rem] w-[1.35rem] text-amber-500" />}
              </span>
            </button>
          </div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Admin Recovery Portal</h1>
          <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
            This hidden page is only for Admin and Super Admin self-recovery. Use your registered contact details and the separate recovery key.
          </p>
        </div>

        <div
          className="recovery-theme-surface px-6 py-7 transition-colors duration-500 ease-in-out sm:px-8 sm:py-8"
          style={{ backgroundColor: recoveryPanelSurfaceColor }}
        >
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
                  name="phone" maxLength={10} pattern="[0-9]{10}" title="Phone number must be exactly 10 digits"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  disabled={!settings.privilegedRecoveryEnabled}
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-slate-700">Recovery Key</label>
              <input
                name="recoveryKey"
                type={showRecoveryKey ? "text" : "password"}
                value={formData.recoveryKey}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-400"
                disabled={!settings.privilegedRecoveryEnabled}
                required
              />
              <button
                type="button"
                onClick={() => setShowRecoveryKey((current) => !current)}
                className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center text-slate-500 transition hover:text-slate-700"
                aria-label={showRecoveryKey ? "Hide recovery key" : "Show recovery key"}
              >
                {showRecoveryKey ? (
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
