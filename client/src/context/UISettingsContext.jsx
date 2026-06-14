import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { normalizeCustomSidebarItem, serializeCustomSidebarItem } from "../utils/iconRegistry";
import { defaultBrandIcon } from "../utils/branding";
import { DEFAULT_ATTENDANCE_UI_SETTINGS } from "../utils/attendanceSettings";

const UISettingsContext = createContext(null);
const defaultFavicon = defaultBrandIcon;

const defaultSettings = {
  instituteId: null,
  appName: "Eduvanta ERP",
  logo: "",
  favicon: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  sidebarColor: "#0f172a",
  loginBackground: "",
  loginBackgroundEnabled: false,
  loginBackgroundImageUrl: "",
  loginBackgroundOverlayEnabled: true,
  loginBackgroundOverlayOpacity: 0.72,
  loginBackgroundBlurEnabled: false,
  loginPanelImageEnabled: false,
  loginPanelImageUrl: "",
  loginPanelImagePosition: "hidden",
  loginPanelImageOverlayEnabled: true,
  loginPanelImageOverlayOpacity: 0.36,
  loginBrandEyebrow: "EDUVANTA ERP",
  loginBrandSubtitle: "Connected campus operations",
  loginHeroTitle: "Smart ERP for Schools, Colleges & Universities",
  loginHeroDescription: "Manage academics, students, staff, fees, attendance, hostel, transport and more from one smart ERP platform.",
  loginLeftPanelAccentColor: "#ccfbf1",
  loginLeftPanelAccentLightColor: "#f0fdfa",
  loginHeroTitleColor: "#ffffff",
  loginHeroTitleLightColor: "#f8fafc",
  loginHeroBodyColor: "#e2e8f0",
  loginHeroBodyLightColor: "#f8fafc",
  loginFooterText: "Smart ERP for Schools, Colleges & Universities",
  loginFooterTextColor: "#e2e8f0",
  loginFooterTextLightColor: "#f8fafc",
  loginFormEyebrow: "SECURE SIGN IN",
  loginFormTitle: "Access your role dashboard",
  loginFormDescription: "Sign in to continue to Eduvanta ERP and manage your institute workflows securely.",
  loginButtonText: "Login to Eduvanta ERP",
  showLoginBrandBlock: true,
  showLoginHeroTitle: true,
  showLoginHeroDescription: true,
  showLoginFeatureCards: true,
  showLoginCopyright: true,
  showLoginThemeToggle: true,
  showLoginAcceptedUsernameHint: true,
  showLoginRememberMe: true,
  loginFeatureCard1Enabled: true,
  loginFeatureCard1Title: "Academic operations",
  loginFeatureCard1Description: "Centralize classes, notices, assignments, exams and attendance in one place.",
  loginFeatureCard2Enabled: true,
  loginFeatureCard2Title: "Campus services",
  loginFeatureCard2Description: "Track hostel, transport, fees, library and staff workflows with role-based access.",
  loginCleanModeEnabled: false,
  buttonStyle: "rounded",
  themeMode: "system",
  footerText: "Smart ERP for Schools, Colleges & Universities",
  showFooter: true,
  captchaEnabled: true,
  attendanceGoodThreshold: DEFAULT_ATTENDANCE_UI_SETTINGS.attendanceGoodThreshold,
  attendanceWarningThreshold: DEFAULT_ATTENDANCE_UI_SETTINGS.attendanceWarningThreshold,
  attendanceGoodColor: DEFAULT_ATTENDANCE_UI_SETTINGS.attendanceGoodColor,
  attendanceWarningColor: DEFAULT_ATTENDANCE_UI_SETTINGS.attendanceWarningColor,
  attendanceCriticalColor: DEFAULT_ATTENDANCE_UI_SETTINGS.attendanceCriticalColor,
  privilegedRecoveryEnabled: false,
  privilegedRecoveryHint: "",
  customSidebarItems: [],
  academicConfig: {
    school: {
      allowedSchoolLevels: ["Pre-Primary", "Primary", "Middle", "Secondary"],
      maxClassNumber: 10,
    },
    college: {
      allowedSchoolLevels: ["Higher Secondary"],
      allowedProgramLevels: ["UG", "PG", "Diploma", "Certificate"],
      maxClassNumber: 12,
    },
    university: {
      allowedProgramLevels: ["UG", "PG", "PhD", "Diploma", "Certificate"],
    },
  },
};

const normalizeSettings = (settings = {}) => ({
  ...defaultSettings,
  ...settings,
  loginBackgroundImageUrl: settings.loginBackgroundImageUrl || settings.loginBackground || defaultSettings.loginBackgroundImageUrl,
  customSidebarItems: Array.isArray(settings.customSidebarItems)
    ? settings.customSidebarItems.map(normalizeCustomSidebarItem)
    : defaultSettings.customSidebarItems,
});

const serializeSettingsForUpdate = (settings = {}) => ({
  ...settings,
  customSidebarItems: Array.isArray(settings.customSidebarItems)
    ? settings.customSidebarItems.map(serializeCustomSidebarItem)
    : [],
});

const getBootstrappedThemeMode = () => {
  if (typeof document === "undefined") {
    return defaultSettings.themeMode;
  }

  const root = document.documentElement;

  if (root.classList.contains("theme-dark")) {
    return "dark";
  }

  if (root.classList.contains("theme-light")) {
    return "light";
  }

  return defaultSettings.themeMode;
};

const applyThemeToDocument = (settings, localThemeMode) => {
  const root = document.documentElement;

  root.style.setProperty("--ui-primary-color", settings.primaryColor);
  root.style.setProperty("--ui-secondary-color", settings.secondaryColor);
  root.style.setProperty("--ui-sidebar-color", settings.sidebarColor);
  root.style.setProperty("--ui-button-radius", getButtonRadius(settings.buttonStyle));

  root.classList.remove("theme-light", "theme-dark");

  const activeTheme = localThemeMode || settings.themeMode || "system";

  if (activeTheme === "light") {
    root.classList.add("theme-light");
  } else if (activeTheme === "dark") {
    root.classList.add("theme-dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "theme-dark" : "theme-light");
  }
};

const getResolvedTheme = (settings, localThemeMode) => {
  const activeTheme = localThemeMode || settings.themeMode || "system";

  if (activeTheme === "light" || activeTheme === "dark") {
    return activeTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getButtonRadius = (buttonStyle) => {
  const radiusMap = {
    rounded: "1rem",
    pill: "9999px",
    square: "0.25rem",
  };

  return radiusMap[buttonStyle] || radiusMap.rounded;
};

const applyFaviconToDocument = (favicon) => {
  if (typeof document === "undefined") {
    return;
  }

  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }

  let faviconLink = document.querySelector("link[rel='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.setAttribute("rel", "icon");
    head.appendChild(faviconLink);
  }

  faviconLink.setAttribute("type", "image/svg+xml");
  faviconLink.setAttribute("href", favicon?.trim() || defaultFavicon);
};

export const UISettingsProvider = ({ children }) => {
  const cachedThemeMode = localStorage.getItem("themeMode") || null;
  const cachedAppName = localStorage.getItem("appNameCache") || defaultSettings.appName;
  const cachedLogo = localStorage.getItem("logoCache") || "";
  const cachedFavicon = localStorage.getItem("faviconCache") || "";

  const [localThemeMode, setLocalThemeMode] = useState(() => {
    return cachedThemeMode;
  });
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    appName: cachedAppName,
    logo: cachedLogo,
    favicon: cachedFavicon,
    themeMode: cachedThemeMode || getBootstrappedThemeMode(),
  }));
  const [loading, setLoading] = useState(true);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getResolvedTheme(
      {
        ...defaultSettings,
        appName: cachedAppName,
        logo: cachedLogo,
        favicon: cachedFavicon,
        themeMode: cachedThemeMode || getBootstrappedThemeMode(),
      },
      cachedThemeMode
    )
  );

  useEffect(() => {
    applyThemeToDocument(settings, localThemeMode);
    const nextResolvedTheme = getResolvedTheme(settings, localThemeMode);
    setResolvedTheme(nextResolvedTheme);

    try {
      localStorage.setItem("resolvedThemeCache", nextResolvedTheme);
    } catch (error) {
      // Ignore storage write failures; theme still applies for the current session.
    }
  }, [settings, localThemeMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const nextAppName = settings.appName?.trim() || defaultSettings.appName;
    document.title = nextAppName;

    try {
      localStorage.setItem("appNameCache", nextAppName);
    } catch (error) {
      // Ignore storage write failures; the in-memory title still updates.
    }
  }, [settings.appName]);

  useEffect(() => {
    applyFaviconToDocument(settings.favicon || "");

    try {
      localStorage.setItem("faviconCache", settings.favicon?.trim() || "");
    } catch (error) {
      // Ignore storage write failures; favicon still updates for the current session.
    }
  }, [settings.favicon]);

  useEffect(() => {
    try {
      localStorage.setItem("logoCache", settings.logo?.trim() || "");
    } catch (error) {
      // Ignore storage write failures; the current session state still updates.
    }
  }, [settings.logo]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => {
      if ((localThemeMode || settings.themeMode || "system") === "system") {
        applyThemeToDocument(settings, localThemeMode);
        setResolvedTheme(getResolvedTheme(settings, localThemeMode));
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleThemeChange);
      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    }

    mediaQuery.addListener(handleThemeChange);
    return () => mediaQuery.removeListener(handleThemeChange);
  }, [settings, localThemeMode]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const { data } = await api.get("/ui-settings/global");
        setSettings(normalizeSettings(data.settings));
      } catch (error) {
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalSettings();
  }, []);

  const refreshSettings = async () => {
    const { data } = await api.get("/ui-settings/global");
    const nextSettings = normalizeSettings(data.settings);
    setSettings(nextSettings);
    return nextSettings;
  };

  const updateGlobalSettings = async (payload) => {
    const { data } = await api.put("/ui-settings/global", serializeSettingsForUpdate(payload));
    const nextSettings = normalizeSettings(data.settings);
    setSettings(nextSettings);
    return data;
  };

  const toggleTheme = () => {
    const activeTheme = localThemeMode || settings.themeMode || "system";
    let nextTheme = "light";
    if (activeTheme === "light") {
      nextTheme = "dark";
    } else if (activeTheme === "dark") {
      nextTheme = "light";
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      nextTheme = prefersDark ? "light" : "dark";
    }

    localStorage.setItem("themeMode", nextTheme);
    setLocalThemeMode(nextTheme);
  };

  return (
    <UISettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        updateGlobalSettings,
        defaultSettings,
        getButtonRadius,
        localThemeMode,
        resolvedTheme,
        toggleTheme,
      }}
    >
      {children}
    </UISettingsContext.Provider>
  );
};

export const useUISettings = () => useContext(UISettingsContext);
