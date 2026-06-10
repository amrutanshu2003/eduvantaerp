import { useEffect, useRef, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import LoginSkeleton from "../components/LoginSkeleton";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";

const createCaptchaText = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
};

const roleRedirectMap = {
  superadmin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  staff: "/staff/dashboard",
};

const getFieldErrors = (message) => {
  if (!message) {
    return { email: "", password: "" };
  }

  const normalizedMessage = message.toLowerCase();

  // 1. Both fields missing
  if (
    normalizedMessage.includes("username/email or roll number and password are required") ||
    normalizedMessage.includes("username and password are required")
  ) {
    return {
      email: "Username is required",
      password: "Password is required",
    };
  }

  // 2. Username missing
  if (
    normalizedMessage === "username is required" ||
    normalizedMessage === "username required"
  ) {
    return {
      email: "Username is required",
      password: "",
    };
  }

  // 3. Password missing
  if (
    normalizedMessage === "password is required" ||
    normalizedMessage === "password required"
  ) {
    return {
      email: "",
      password: "Password is required",
    };
  }

  const hasUserTerm =
    normalizedMessage.includes("username") ||
    normalizedMessage.includes("email") ||
    normalizedMessage.includes("roll") ||
    normalizedMessage.includes("phone") ||
    normalizedMessage.includes("employee") ||
    normalizedMessage.includes("teacher id") ||
    normalizedMessage.includes("staff id");
  const hasPasswordTerm = normalizedMessage.includes("password");

  // 4. Combined invalid error (both terms are present + invalid keyword)
  if (hasUserTerm && hasPasswordTerm && normalizedMessage.includes("invalid")) {
    return {
      email: "Invalid username or password",
      password: "Invalid username or password",
    };
  }

  // 5. Specific invalid username/roll number
  if (normalizedMessage.includes("invalid username") || normalizedMessage.includes("invalid roll number")) {
    return {
      email: "Invalid username",
      password: "",
    };
  }

  // 6. Specific invalid password
  if (normalizedMessage.includes("invalid password")) {
    return {
      email: "",
      password: "Invalid password",
    };
  }

  // 7. General fallbacks
  if (hasUserTerm) {
    return { email: message, password: "" };
  }

  if (hasPasswordTerm) {
    return { email: "", password: message };
  }

  return { email: "", password: "" };
};

const getCaptchaError = (message) => {
  if (!message) {
    return "";
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("captcha")) {
    return message;
  }

  return "";
};

const roleBasePathMap = {
  superadmin: ["/super-admin", "/admin", "/teacher", "/student", "/parent", "/staff"],
  admin: ["/admin"],
  teacher: ["/teacher"],
  student: ["/student"],
  parent: ["/parent"],
  staff: ["/staff"],
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginCardRef = useRef(null);
  const themeToggleRef = useRef(null);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const loginInteractionRef = useRef(false);
  const { login } = useAuth();
  const {
    settings,
    getButtonRadius,
    loading: settingsLoading,
    resolvedTheme,
    toggleTheme,
  } = useUISettings();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaText, setCaptchaText] = useState(() => createCaptchaText());
  const [captchaInput, setCaptchaInput] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [themeReveal, setThemeReveal] = useState(null);
  const fieldErrors = getFieldErrors(error);
  const captchaError = getCaptchaError(error);

  const handleChange = (event) => {
    const fieldName = event.target.name === "username" ? "email" : event.target.name;

    setFormData((current) => ({
      ...current,
      [fieldName]: event.target.value,
    }));
  };

  const refreshCaptcha = () => {
    setCaptchaText(createCaptchaText());
    setCaptchaInput("");
  };

  const markLoginInteracted = () => {
    loginInteractionRef.current = true;
  };

  useEffect(() => {
    const clearLoginFields = () => {
      if (loginInteractionRef.current) {
        return;
      }

      setFormData({ email: "", password: "" });

      if (usernameInputRef.current) {
        usernameInputRef.current.value = "";
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }
    };

    clearLoginFields();
    const initialClearTimeout = window.setTimeout(clearLoginFields, 250);
    const followupClearTimeout = window.setTimeout(clearLoginFields, 900);

    const handlePageShow = (event) => {
      if (event.persisted) {
        loginInteractionRef.current = false;
        clearLoginFields();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.clearTimeout(initialClearTimeout);
      window.clearTimeout(followupClearTimeout);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    if (!themeReveal) {
      return undefined;
    }

    const cleanupTimer = window.setTimeout(() => {
      setThemeReveal(null);
    }, themeReveal.duration);

    return () => window.clearTimeout(cleanupTimer);
  }, [themeReveal]);

  const handleThemeToggle = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      toggleTheme();
      return;
    }

    const rect = themeToggleRef.current?.getBoundingClientRect();
    const cardRect = loginCardRef.current?.getBoundingClientRect();
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
      nextTheme: isDark ? "light" : "dark",
    });

    window.setTimeout(() => {
      toggleTheme();
    }, isDark ? 30 : 300);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const usernameVal = (usernameInputRef.current?.value || formData.email || "").trim();
    const passwordVal = passwordInputRef.current?.value || formData.password || "";
    const captchaVal = captchaInput.trim().toUpperCase();

    if (!usernameVal && !passwordVal) {
      setShakeKey((current) => current + 1);
      setError("Username and password are required");
      return;
    }

    if (!usernameVal) {
      setShakeKey((current) => current + 1);
      setError("Username is required");
      return;
    }

    if (!passwordVal) {
      setShakeKey((current) => current + 1);
      setError("Password is required");
      return;
    }

    if (settings.captchaEnabled) {
      if (!captchaVal) {
        setShakeKey((current) => current + 1);
        setError("Captcha is required");
        return;
      }

      if (captchaVal !== captchaText) {
        setShakeKey((current) => current + 1);
        setError("Invalid captcha. Please try again.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const user = await login(usernameVal, passwordVal);
      const fallbackPath = roleRedirectMap[user.role] || "/unauthorized";
      const requestedPath = location.state?.from?.pathname;
      const allowedBasePaths = roleBasePathMap[user.role] || [];
      const redirectPath =
        requestedPath &&
        requestedPath !== "/login" &&
        requestedPath !== "/unauthorized" &&
        allowedBasePaths.some((basePath) => requestedPath.startsWith(basePath))
          ? requestedPath
          : fallbackPath;
      refreshCaptcha();
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setShakeKey((current) => current + 1);
      setError(
        requestError.response?.data?.message ||
          "Unable to sign in."
      );
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return <LoginSkeleton message="Loading login page..." />;
  }

  const isDark = resolvedTheme === "dark";
  const loginPanelSurfaceColor = "color-mix(in srgb, var(--theme-surface-strong) 97%, transparent)";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-4 sm:px-6 sm:py-5"
      style={
        settings.loginBackground
          ? {
              backgroundImage: `linear-gradient(rgba(2,6,23,0.82), rgba(2,6,23,0.82)), url(${settings.loginBackground})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <style>
        {`
          @keyframes login-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          @keyframes login-button-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes login-theme-expand {
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
          @keyframes login-theme-collapse {
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
          @keyframes login-theme-icon-bloom {
            0% { transform: scale(1) rotate(0deg); }
            35% { transform: scale(0.88) rotate(-10deg); }
            100% { transform: scale(1.08) rotate(10deg); }
          }
          @keyframes login-theme-icon-dock {
            0% { transform: scale(1) rotate(0deg); }
            40% { transform: scale(1.08) rotate(8deg); }
            100% { transform: scale(0.86) rotate(-10deg); }
          }
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px var(--theme-input-bg) inset !important;
            box-shadow: 0 0 0 1000px var(--theme-input-bg) inset !important;
            -webkit-text-fill-color: var(--theme-input-text) !important;
          }
          @media (prefers-reduced-motion: reduce) {
            .login-theme-surface {
              transition: none !important;
            }
          }
        `}
      </style>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div
        ref={loginCardRef}
        className="login-theme-surface relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-card transition-colors duration-500 ease-in-out lg:grid-cols-[1.05fr_0.95fr]"
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
              animation: `${themeReveal.direction === "expand" ? "login-theme-expand" : "login-theme-collapse"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              transformOrigin: `${themeReveal.x}px ${themeReveal.y}px`,
            }}
          />
        ) : null}

        <div
          className="login-theme-surface reveal-fade-up relative overflow-hidden px-6 py-7 text-white transition-colors duration-500 ease-in-out sm:px-8 sm:py-8 lg:px-10"
          style={{
            background: `linear-gradient(160deg, ${settings.sidebarColor} 0%, ${settings.primaryColor} 100%)`,
          }}
        >
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col gap-6">
            <div className="reveal-stagger">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/15 backdrop-blur">
                  <div className="grid h-6 w-6 grid-cols-2 gap-1">
                    <span className="rounded-sm bg-white" />
                    <span className="rounded-sm bg-white/70" />
                    <span className="rounded-sm bg-white/70" />
                    <span className="rounded-sm bg-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-100">
                    {settings.appName}
                  </p>
                  <p className="mt-1 text-sm text-white/75">Connected campus operations</p>
                </div>
              </div>

              <h1 className="mt-6 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-[3.35rem] lg:text-[3.7rem]">
                Smart ERP for Schools, Colleges & Universities
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                Manage academics, students, staff, fees, attendance, hostel, transport and more from one smart ERP platform.
              </p>
            </div>

            <div className="reveal-stagger grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-brand-100">Academic operations</p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Centralize classes, notices, assignments, exams and attendance in one place.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-brand-100">Campus services</p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Track hostel, transport, fees, library and staff workflows with role-based access.
                </p>
              </div>
            </div>

            <p className="reveal-soft reveal-delay-4 pt-1 text-sm text-white/70">{settings.footerText}</p>
          </div>
        </div>

        <div
          className="login-theme-surface reveal-fade-up reveal-delay-2 border-l border-slate-200/70 p-6 transition-colors duration-500 ease-in-out sm:p-8 lg:p-10"
          style={{ backgroundColor: loginPanelSurfaceColor }}
        >
          <div className="mx-auto w-full max-w-md">
            <div className="reveal-soft flex items-start justify-between gap-4">
              <p
                className="pt-1 text-sm uppercase tracking-[0.35em]"
                style={{ color: settings.primaryColor }}
              >
                Secure Sign In
              </p>
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
                          animation: `${themeReveal.direction === "expand" ? "login-theme-icon-bloom" : "login-theme-icon-dock"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                        }
                      : undefined
                  }
                >
                  {isDark ? (
                    <FiMoon className="h-5 w-5 text-slate-200" />
                  ) : (
                    <FiSun className="h-[1.35rem] w-[1.35rem] text-amber-500" />
                  )}
                </span>
              </button>
            </div>
            <h2 className="reveal-soft reveal-delay-1 mt-4 text-[2.35rem] font-semibold leading-tight text-ink sm:text-[2.8rem]">
              Access your role dashboard
            </h2>
            <p className="reveal-soft reveal-delay-2 mt-3 text-sm leading-6 text-slate-500">
              Sign in to continue to {settings.appName} and manage your institute workflows securely.
            </p>
            <p className="reveal-soft reveal-delay-3 mt-2 text-sm leading-6 text-slate-500">
              Use email, teacher ID, employee ID, mobile number, or roll number as your username.
            </p>
            <p className="reveal-soft reveal-delay-4 mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              If you forgot your password, contact your Admin or Super Admin for a new password.
            </p>

            <form className="reveal-stagger mt-8 space-y-5" onSubmit={handleSubmit} autoComplete="on" method="post">
              <div
                key={shakeKey}
                className="space-y-5"
                style={error ? { animation: "login-shake 0.35s ease-in-out" } : undefined}
              >
                {error && !fieldErrors.email && !fieldErrors.password && !captchaError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
                    {error}
                  </div>
                )}
                <div>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex h-14 w-14 items-center justify-center ${fieldErrors.email ? "text-red-400" : "text-slate-400"}`}>
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      ref={usernameInputRef}
                      id="username"
                      name="username"
                      type="text"
                      defaultValue=""
                      onPointerDown={markLoginInteracted}
                      onFocus={markLoginInteracted}
                      onChange={handleChange}
                      className={`peer h-14 w-full rounded-2xl border px-4 pb-3 pt-5 pl-16 text-base leading-6 outline-none transition ${
                        fieldErrors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                      }`}
                      placeholder=" "
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                    />
                    <label
                      htmlFor="username"
                      className={`pointer-events-none absolute left-14 z-10 px-1 text-sm font-medium transition-all duration-200 -top-2.5 translate-y-0 ${
                        fieldErrors.email
                          ? "text-red-500 peer-placeholder-shown:text-red-400 peer-focus:text-red-500"
                          : "text-brand-700 peer-placeholder-shown:text-slate-400 peer-focus:text-brand-700"
                      } peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm`}
                      style={{ backgroundColor: loginPanelSurfaceColor }}
                    >
                      {fieldErrors.email || "Username"}
                    </label>
                  </div>
                  <p className="mt-2 px-1 text-xs text-slate-500">
                    Accepted usernames: email, teacher ID, employee ID, mobile number, or roll number.
                  </p>
                </div>

                <div>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex h-14 w-14 items-center justify-center ${fieldErrors.password ? "text-red-400" : "text-slate-400"}`}>
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                        <rect x="5" y="10" width="14" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 10V8a4 4 0 118 0v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      defaultValue=""
                      onPointerDown={markLoginInteracted}
                      onFocus={markLoginInteracted}
                      onChange={handleChange}
                      className={`peer h-14 w-full rounded-2xl border px-4 pb-3 pt-5 pl-16 pr-14 text-base leading-6 outline-none transition ${
                        fieldErrors.password ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                      }`}
                      placeholder=" "
                      autoComplete="current-password"
                      required
                    />
                    <label
                      htmlFor="password"
                      className={`pointer-events-none absolute left-14 z-10 px-1 text-sm font-medium transition-all duration-200 -top-2.5 translate-y-0 ${
                        fieldErrors.password
                          ? "text-red-500 peer-placeholder-shown:text-red-400 peer-focus:text-red-500"
                          : "text-brand-700 peer-placeholder-shown:text-slate-400 peer-focus:text-brand-700"
                      } peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm`}
                      style={{ backgroundColor: loginPanelSurfaceColor }}
                    >
                      {fieldErrors.password || "Enter your password"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className={`absolute inset-y-0 right-0 flex h-14 w-14 items-center justify-center transition ${
                        fieldErrors.password ? "text-red-400 hover:text-red-500" : "text-slate-500 hover:text-slate-700"
                      }`}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
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
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Remember me
                  </label>
                  <p className="text-xs text-slate-400">
                    {rememberMe ? "This device will stay signed in." : "Session will continue normally."}
                  </p>
                </div>

                {settings.captchaEnabled ? (
                  <div
                    className="space-y-2"
                    style={{
                      animation: captchaError ? "login-shake 0.35s ease-in-out" : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-11 min-w-[112px] select-none items-center justify-center rounded-xl border border-dashed px-3 text-center text-sm font-semibold tracking-[0.3em]"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--theme-surface-muted) 72%, transparent)",
                          borderColor: "var(--theme-border-strong)",
                          color: "var(--theme-text-soft)",
                        }}
                        aria-label={`Captcha code ${captchaText.split("").join(" ")}`}
                      >
                        {captchaText}
                      </div>

                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition duration-200 hover:scale-[1.03]"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--theme-surface-muted) 78%, transparent)",
                          borderColor: "var(--theme-border)",
                          color: "var(--theme-text-muted)",
                        }}
                        aria-label="Refresh captcha"
                        title="Refresh captcha"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                          <path d="M20 11a8 8 0 00-14.9-3M4 13a8 8 0 0014.9 3" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M4 4v4h4M20 20v-4h-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <div className="relative min-w-0 flex-1">
                        <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex h-11 w-11 items-center justify-center ${captchaError ? "text-red-400" : "text-slate-400"}`}>
                          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 12h16M4 7h16M4 17h10" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <input
                          id="captcha"
                          name="captcha"
                          type="text"
                          value={captchaInput}
                          onChange={(event) => {
                            setCaptchaInput(event.target.value.toUpperCase());
                            if (captchaError) {
                              setError("");
                            }
                          }}
                          className={`peer h-11 w-full rounded-xl border bg-transparent px-4 pb-2 pt-4 pl-11 text-sm uppercase tracking-[0.24em] outline-none transition ${
                            captchaError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                          }`}
                          placeholder=" "
                          autoComplete="off"
                          spellCheck="false"
                          maxLength={6}
                          required
                        />
                        <label
                          htmlFor="captcha"
                          className={`pointer-events-none absolute left-10 z-10 px-1 text-xs font-medium transition-all duration-200 -top-2 translate-y-0 ${
                            captchaError
                              ? "text-red-500 peer-placeholder-shown:text-red-400 peer-focus:text-red-500"
                              : "text-brand-700 peer-placeholder-shown:text-slate-400 peer-focus:text-brand-700"
                          } peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs`}
                          style={{ backgroundColor: loginPanelSurfaceColor }}
                        >
                          {captchaError || "Enter captcha"}
                        </label>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting
                    ? `linear-gradient(110deg, ${settings.primaryColor} 15%, ${settings.secondaryColor} 50%, ${settings.primaryColor} 85%)`
                    : settings.primaryColor,
                  backgroundSize: submitting ? "220% 100%" : undefined,
                  animation: submitting ? "login-button-shimmer 1.4s linear infinite" : undefined,
                  borderRadius: getButtonRadius(settings.buttonStyle),
                }}
                className="w-full overflow-hidden px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {submitting ? "Logging in..." : "Login to Eduvanta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
