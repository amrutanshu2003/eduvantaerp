import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import LoginSkeleton from "../components/LoginSkeleton";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import useBranding from "../hooks/useBranding";

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
  const { login, user, loading: authLoading } = useAuth();
  const {
    settings,
    getButtonRadius,
    loading: settingsLoading,
    resolvedTheme,
    toggleTheme,
  } = useUISettings();
  const branding = useBranding();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaText, setCaptchaText] = useState(() => createCaptchaText());
  const [captchaInput, setCaptchaInput] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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

  // Redirect logged-in users to their last visited path or dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const requestedPath = location.state?.from?.pathname;
      const allowedBasePaths = roleBasePathMap[user.role] || [];
      const isRequestedPathAllowed = requestedPath &&
        requestedPath !== "/login" &&
        requestedPath !== "/unauthorized" &&
        allowedBasePaths.some((basePath) => requestedPath.startsWith(basePath));

      const savedPath = localStorage.getItem(`last_path_${user?._id || user?.role || "default"}`);
      const fallbackPath = roleRedirectMap[user.role] || "/unauthorized";

      const redirectPath = isRequestedPathAllowed
        ? requestedPath
        : (savedPath || fallbackPath);

      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

  const themeSwitchRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (themeSwitchRef.current) clearTimeout(themeSwitchRef.current);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, []);

  const handleThemeToggle = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    if (prefersReducedMotion) {
      toggleTheme();
      return;
    }

    if (themeSwitchRef.current) clearTimeout(themeSwitchRef.current);
    if (cleanupRef.current) clearTimeout(cleanupRef.current);

    const rect = themeToggleRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Add transition classes BEFORE startViewTransition to prevent flicker
    const transitionClass = nextTheme === "dark" ? "theme-transition-to-dark" : "theme-transition-to-light";
    document.documentElement.classList.add(transitionClass);
    document.documentElement.classList.add("theme-transitioning");

    // Force body background to current theme color to prevent flicker
    const currentBg = resolvedTheme === "dark" ? "#07111f" : "#f8fafc";
    document.body.style.background = currentBg;
    document.documentElement.style.background = currentBg;

    if (document.startViewTransition) {
      setThemeReveal({
        visible: false,
        x,
        y,
        radius: maxRadius,
        nextTheme,
      });

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          toggleTheme();
        });
      });

      transition.ready.then(() => {
        const openClipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ];

        const closeClipPath = [
          `circle(${maxRadius}px at ${x}px ${y}px)`,
          `circle(0px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: nextTheme === "dark" ? openClipPath : closeClipPath,
          },
          {
            duration: 550,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement:
              nextTheme === "dark"
                ? "::view-transition-new(root)"
                : "::view-transition-old(root)",
          }
        );
      });

      transition.finished.finally(() => {
        setThemeReveal(null);
        // Remove transition classes after animation completes
        document.documentElement.classList.remove(transitionClass);
        document.documentElement.classList.remove("theme-transitioning");
        // Remove inline background styles
        document.body.style.background = "";
        document.documentElement.style.background = "";
      });
    } else {
      document.documentElement.classList.add("theme-transition-active");

      setThemeReveal({
        visible: true,
        x,
        y,
        radius: maxRadius,
        nextTheme,
      });

      // Switch theme class at 45% of 650ms (~290ms)
      themeSwitchRef.current = setTimeout(() => {
        toggleTheme();
      }, 290);

      // Clean up animation state at 650ms
      cleanupRef.current = setTimeout(() => {
        setThemeReveal(null);
        document.documentElement.classList.remove("theme-transition-active");
        document.documentElement.classList.remove(transitionClass);
        document.documentElement.classList.remove("theme-transitioning");
        document.body.style.background = "";
        document.documentElement.style.background = "";
      }, 650);
    }
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
      const savedPath = localStorage.getItem(`last_path_${user?._id || user?.role || "default"}`);
      const fallbackPath = savedPath || roleRedirectMap[user.role] || "/unauthorized";
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

  if (settingsLoading || authLoading) {
    return <LoginSkeleton message="Loading..." />;
  }

  const isDark = resolvedTheme === "dark";
  const loginPanelSurfaceColor = "color-mix(in srgb, var(--theme-surface-strong) 97%, transparent)";
  const loginBackgroundImage = settings.loginBackgroundImageUrl || settings.loginBackground;
  const loginBackgroundActive = Boolean(settings.loginBackgroundEnabled && loginBackgroundImage);
  const loginBackgroundOverlayOpacity = Number.isFinite(Number(settings.loginBackgroundOverlayOpacity))
    ? Number(settings.loginBackgroundOverlayOpacity)
    : 0.72;
  const loginBackgroundOverlay = settings.loginBackgroundOverlayEnabled
    ? isDark
      ? `rgba(2, 6, 23, ${loginBackgroundOverlayOpacity})`
      : `rgba(248, 250, 252, ${Math.min(Math.max(loginBackgroundOverlayOpacity * 0.92, 0.2), 0.9)})`
    : "transparent";
  const loginPanelImageVisible =
    settings.loginPanelImageEnabled &&
    settings.loginPanelImageUrl &&
    settings.loginPanelImagePosition !== "hidden";
  const loginPanelImageOverlayOpacity = Number.isFinite(Number(settings.loginPanelImageOverlayOpacity))
    ? Number(settings.loginPanelImageOverlayOpacity)
    : 0.36;
  const showBrandBlock = settings.showLoginBrandBlock !== false;
  const showHeroTitle = settings.showLoginHeroTitle !== false;
  const showHeroDescription = settings.showLoginHeroDescription !== false;
  const showFeatureCards = settings.loginCleanModeEnabled ? false : settings.showLoginFeatureCards !== false;
  const showCopyright = settings.loginCleanModeEnabled ? false : settings.showLoginCopyright !== false;
  const showThemeToggle = settings.showLoginThemeToggle !== false;
  const showAcceptedUsernameHint = settings.showLoginAcceptedUsernameHint !== false;
  const showRememberMe = settings.showLoginRememberMe !== false;
  const loginButtonLabel = settings.loginButtonText?.trim() || `Login to ${branding.appName}`;
  const loginBrandEyebrow = settings.loginBrandEyebrow?.trim() || branding.appName;
  const loginBrandSubtitle = settings.loginBrandSubtitle?.trim() || "Connected campus operations";
  const loginHeroTitle = settings.loginHeroTitle?.trim() || "Smart ERP for Schools, Colleges & Universities";
  const loginHeroDescription = settings.loginHeroDescription?.trim() || "Manage academics, students, staff, fees, attendance, hostel, transport and more from one smart ERP platform.";
  const loginFormEyebrow = settings.loginFormEyebrow?.trim() || "Secure Sign In";
  const loginFormTitle = settings.loginFormTitle?.trim() || "Access your role dashboard";
  const loginFormDescription = settings.loginFormDescription?.trim() || `Sign in to continue to ${branding.appName} and manage your institute workflows securely.`;
  const leftPanelAccentColor = isDark
    ? (settings.loginLeftPanelAccentColor || "#ccfbf1")
    : (settings.loginLeftPanelAccentLightColor || settings.loginLeftPanelAccentColor || "#f0fdfa");
  const heroTitleColor = isDark
    ? (settings.loginHeroTitleColor || "#ffffff")
    : (settings.loginHeroTitleLightColor || settings.loginHeroTitleColor || "#f8fafc");
  const heroBodyColor = isDark
    ? (settings.loginHeroBodyColor || "#e2e8f0")
    : (settings.loginHeroBodyLightColor || settings.loginHeroBodyColor || "#f8fafc");
  const loginFooterText = settings.loginFooterText?.trim() || settings.footerText || "Smart ERP for Schools, Colleges & Universities";
  const loginFooterTextColor = isDark
    ? (settings.loginFooterTextColor || settings.loginHeroBodyColor || "#e2e8f0")
    : (settings.loginFooterTextLightColor || settings.loginFooterTextColor || settings.loginHeroBodyLightColor || "#f8fafc");
  const featureCards = [
    {
      enabled: settings.loginFeatureCard1Enabled !== false,
      title: settings.loginFeatureCard1Title?.trim() || "Academic operations",
      description:
        settings.loginFeatureCard1Description?.trim() ||
        "Centralize classes, notices, assignments, exams and attendance in one place.",
    },
    {
      enabled: settings.loginFeatureCard2Enabled !== false,
      title: settings.loginFeatureCard2Title?.trim() || "Campus services",
      description:
        settings.loginFeatureCard2Description?.trim() ||
        "Track hostel, transport, fees, library and staff workflows with role-based access.",
    },
  ].filter((card) => card.enabled);
  const showLeftPanel = showBrandBlock || showHeroTitle || showHeroDescription || (showFeatureCards && featureCards.length > 0) || showCopyright;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-50 px-4 py-6 transition-colors duration-500 ease-in-out dark:bg-slate-950"
      style={
        loginBackgroundActive
          ? {
            backgroundImage: `linear-gradient(${loginBackgroundOverlay}, ${loginBackgroundOverlay}), url(${loginBackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: settings.loginBackgroundBlurEnabled ? "saturate(1.02)" : undefined,
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
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px var(--theme-input-bg) inset !important;
            box-shadow: 0 0 0 1000px var(--theme-input-bg) inset !important;
            -webkit-text-fill-color: var(--theme-input-text) !important;
          }
          .login-password-input::-ms-reveal,
          .login-password-input::-ms-clear {
            display: none;
          }
          @media (prefers-reduced-motion: reduce) {
            .login-theme-surface {
              transition: none !important;
            }
          }
        `}
      </style>
      {themeReveal && themeReveal.visible ? (
        <div
          aria-hidden="true"
          className="telegram-theme-overlay"
          style={{
            background: themeReveal.nextTheme === "dark" ? "#020617" : "#f8fafc",
            "--ripple-x": `${themeReveal.x}px`,
            "--ripple-y": `${themeReveal.y}px`,
            "--ripple-radius": `${themeReveal.radius}px`,
          }}
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div
        ref={loginCardRef}
        className={`login-theme-surface relative mx-auto w-full max-w-[1320px] overflow-hidden rounded-3xl bg-white shadow-card transition-colors duration-500 ease-in-out lg:grid lg:min-h-[560px] ${showLeftPanel ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
      >

        {showLeftPanel ? (
        <div
          className="login-theme-surface reveal-fade-up relative hidden overflow-hidden px-8 py-8 text-white transition-colors duration-500 ease-in-out lg:flex lg:px-10 lg:py-10 xl:px-12"
          style={{
            background:
              loginPanelImageVisible && settings.loginPanelImagePosition === "background"
                ? `linear-gradient(rgba(15,23,42,${settings.loginPanelImageOverlayEnabled ? loginPanelImageOverlayOpacity : 0}), rgba(15,23,42,${settings.loginPanelImageOverlayEnabled ? Math.min(loginPanelImageOverlayOpacity + 0.08, 0.9) : 0})), url(${settings.loginPanelImageUrl}) center/cover`
                : `linear-gradient(160deg, ${settings.sidebarColor} 0%, ${settings.primaryColor} 100%)`,
          }}
        >
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-center gap-6">
            {loginPanelImageVisible && settings.loginPanelImagePosition === "top" ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10">
                <div className="relative h-44 w-full">
                  <img
                    src={settings.loginPanelImageUrl}
                    alt={`${branding.appName} campus preview`}
                    className="h-full w-full object-cover"
                  />
                  {settings.loginPanelImageOverlayEnabled ? (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: `rgba(15, 23, 42, ${loginPanelImageOverlayOpacity})` }}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className={`reveal-stagger ${settings.loginCleanModeEnabled ? "space-y-3" : "space-y-4"}`}>
              {showBrandBlock ? (
              <div className="flex items-center gap-3">
                <BrandMark
                  appName={branding.appName}
                  logo={branding.logo}
                  size="xl"
                  className="bg-white/12 ring-white/20 backdrop-blur"
                  imageClassName="p-2"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] break-words" style={{ color: leftPanelAccentColor }}>
                    {loginBrandEyebrow}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: heroBodyColor }}>{loginBrandSubtitle}</p>
                </div>
              </div>
              ) : null}

              {showHeroTitle ? (
                <h1 className="max-w-[24rem] text-4xl font-semibold leading-[1.05] lg:text-5xl xl:text-[56px]" style={{ color: heroTitleColor }}>
                  {loginHeroTitle}
                </h1>
              ) : null}
              {showHeroDescription ? (
                <p className="max-w-[25rem] text-sm leading-6 sm:text-base" style={{ color: heroBodyColor }}>
                  {loginHeroDescription}
                </p>
              ) : null}
            </div>

            {showFeatureCards && featureCards.length > 0 ? (
              <div className={`reveal-stagger grid gap-3 ${featureCards.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {featureCards.map((card) => (
                  <div key={card.title} className="rounded-[1.6rem] border border-white/10 bg-white/10 p-3.5 backdrop-blur">
                    <p className="text-sm" style={{ color: leftPanelAccentColor }}>{card.title}</p>
                    <p className="mt-1.5 text-sm leading-5" style={{ color: heroBodyColor }}>
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {showCopyright ? (
              <div className="reveal-soft reveal-delay-4 rounded-[1.6rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs leading-5" style={{ color: loginFooterTextColor }}>{loginFooterText}</p>
              </div>
            ) : null}
          </div>
        </div>
        ) : null}

        <div
          className={`login-theme-surface reveal-fade-up reveal-delay-2 border-slate-200/70 p-6 transition-colors duration-500 ease-in-out sm:p-8 lg:flex lg:items-center lg:border-t-0 lg:px-10 lg:py-8 xl:px-12 xl:py-10 ${showLeftPanel ? "lg:border-l" : "lg:col-span-1"}`}
          style={{ backgroundColor: loginPanelSurfaceColor }}
        >
          <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center">
            {showBrandBlock ? (
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <BrandMark
                appName={branding.appName}
                logo={branding.logo}
                size="lg"
                className="ring-slate-200/80 dark:ring-white/10"
                imageClassName="p-1.5"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: settings.primaryColor }}>
                  {loginBrandEyebrow}
                </p>
                <p className="mt-1 text-sm text-slate-500">{loginBrandSubtitle}</p>
              </div>
            </div>
            ) : null}
            <div className="reveal-soft flex items-start justify-between gap-4">
              <p
                className="pt-1 text-sm uppercase tracking-[0.35em]"
                style={{ color: settings.primaryColor }}
              >
                {loginFormEyebrow}
              </p>
              {showThemeToggle ? (
              <button
                ref={themeToggleRef}
                type="button"
                onClick={handleThemeToggle}
                disabled={Boolean(themeReveal)}
                className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-500 ease-in-out hover:scale-105 hover:rotate-6 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`theme-toggle-icon-spin flex items-center justify-center ${themeReveal ? "theme-toggle-animating" : ""}`}
                >
                  {isDark ? (
                    <FiMoon className="h-5 w-5 text-slate-200" />
                  ) : (
                    <FiSun className="h-[1.35rem] w-[1.35rem] text-amber-500" />
                  )}
                </span>
              </button>
              ) : null}
            </div>
            <h2 className="reveal-soft reveal-delay-1 mt-3 text-4xl font-semibold leading-[1.05] text-ink lg:text-5xl">
              {loginFormTitle}
            </h2>
            <p className="reveal-soft reveal-delay-2 mt-2.5 text-sm leading-6 text-slate-500">
              {loginFormDescription}
            </p>

            <form className="reveal-stagger mt-6 space-y-4" onSubmit={handleSubmit} autoComplete="on" method="post">
              <div
                key={shakeKey}
                className="space-y-4"
                style={error ? { animation: "login-shake 0.35s ease-in-out" } : undefined}
              >
                {error && !fieldErrors.email && !fieldErrors.password && !captchaError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
                    {error}
                  </div>
                )}
                <div>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex h-[3.25rem] w-[3.25rem] items-center justify-center sm:h-[3.375rem] sm:w-[3.375rem] ${fieldErrors.email ? "text-red-400" : "text-slate-400"}`}>
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
                      className={`peer h-[3.25rem] w-full rounded-2xl border px-4 pb-3 pt-5 pl-14 text-base leading-6 outline-none transition sm:h-[3.375rem] sm:pl-16 ${fieldErrors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                        }`}
                      placeholder=" "
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                    />
                    <label
                      htmlFor="username"
                      className={`pointer-events-none absolute left-12 z-10 px-1 text-sm font-medium transition-all duration-200 -top-2.5 translate-y-0 sm:left-14 ${fieldErrors.email
                          ? "text-red-500 peer-placeholder-shown:text-red-400 peer-focus:text-red-500"
                          : "text-brand-700 peer-placeholder-shown:text-slate-400 peer-focus:text-brand-700"
                        } peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm`}
                      style={{ backgroundColor: loginPanelSurfaceColor }}
                    >
                      {fieldErrors.email || "Username"}
                    </label>
                  </div>
                  {showAcceptedUsernameHint ? (
                    <p className="mt-2 px-1 text-xs text-slate-500">
                      Accepted usernames: email, teacher ID, employee ID, mobile number, or roll number.
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex h-[3.25rem] w-[3.25rem] items-center justify-center sm:h-[3.375rem] sm:w-[3.375rem] ${fieldErrors.password ? "text-red-400" : "text-slate-400"}`}>
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
                      className={`login-password-input peer h-[3.25rem] w-full rounded-2xl border px-4 pb-3 pt-5 pl-14 pr-12 text-base leading-6 outline-none transition sm:h-[3.375rem] sm:pl-16 sm:pr-14 ${fieldErrors.password ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                        }`}
                      placeholder=" "
                      autoComplete="current-password"
                      required
                    />
                    <label
                      htmlFor="password"
                      className={`pointer-events-none absolute left-12 z-10 px-1 text-sm font-medium transition-all duration-200 -top-2.5 translate-y-0 sm:left-14 ${fieldErrors.password
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
                      className={`absolute inset-y-0 right-0 flex h-[3.25rem] w-12 items-center justify-center transition sm:h-[3.375rem] sm:w-14 ${fieldErrors.password ? "text-red-400 hover:text-red-500" : "text-slate-500 hover:text-slate-700"
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

                {showRememberMe ? (
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
                ) : null}

                {settings.captchaEnabled ? (
                  <div
                    className="space-y-2"
                    style={{
                      animation: captchaError ? "login-shake 0.35s ease-in-out" : undefined,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        <div
                          className="flex h-11 min-w-[118px] select-none items-center justify-center rounded-xl border border-dashed px-3 text-center text-sm font-semibold tracking-[0.3em]"
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
                      </div>

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
                          className={`peer h-11 w-full rounded-xl border bg-transparent px-4 pb-2 pt-4 pl-11 text-sm uppercase tracking-[0.24em] outline-none transition ${captchaError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-600"
                            }`}
                          placeholder=" "
                          autoComplete="off"
                          spellCheck="false"
                          maxLength={6}
                          required
                        />
                        <label
                          htmlFor="captcha"
                          className={`pointer-events-none absolute left-10 z-10 px-1 text-xs font-medium transition-all duration-200 -top-2 translate-y-0 ${captchaError
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
                className="h-[3.25rem] w-full overflow-hidden px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-80 sm:h-[3.375rem]"
              >
                {submitting ? "Logging in..." : loginButtonLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
