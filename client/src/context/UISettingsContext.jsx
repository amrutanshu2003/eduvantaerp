import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { normalizeCustomSidebarItem, serializeCustomSidebarItem } from "../utils/iconRegistry";

const UISettingsContext = createContext(null);
const defaultFavicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230f766e'/%3E%3Cstop offset='100%25' stop-color='%2314b8a6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='18' fill='url(%23g)'/%3E%3Cpath d='M19 20h17c7.2 0 12 4.4 12 11.1 0 4.8-2.4 8.3-6.6 10.1L48 51H38.4l-5.3-8.3h-5V51H19V20zm9.1 7.4v8h7c2.9 0 4.5-1.5 4.5-4s-1.6-4-4.5-4h-7z' fill='white'/%3E%3C/svg%3E";

const defaultSettings = {
  instituteId: null,
  appName: "Eduvanta ERP",
  logo: "",
  favicon: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  sidebarColor: "#0f172a",
  loginBackground: "",
  buttonStyle: "rounded",
  themeMode: "system",
  footerText: "Smart ERP for Schools, Colleges & Universities",
  showFooter: true,
  captchaEnabled: true,
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
  const [localThemeMode, setLocalThemeMode] = useState(() => {
    return localStorage.getItem("themeMode") || null;
  });
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    themeMode: localStorage.getItem("themeMode") || getBootstrappedThemeMode(),
  }));
  const [loading, setLoading] = useState(true);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getResolvedTheme(
      { ...defaultSettings, themeMode: localStorage.getItem("themeMode") || getBootstrappedThemeMode() },
      localStorage.getItem("themeMode") || null
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
