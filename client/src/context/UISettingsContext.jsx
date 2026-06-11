import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const UISettingsContext = createContext(null);

const defaultSettings = {
  instituteId: null,
  appName: "Eduvanta ERP",
  logo: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  sidebarColor: "#0f172a",
  loginBackground: "",
  buttonStyle: "rounded",
  themeMode: "system",
  footerText: "Smart ERP for Schools, Colleges & Universities",
  captchaEnabled: true,
  privilegedRecoveryEnabled: false,
  privilegedRecoveryHint: "",
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
        const { data } = await api.get("/settings/public");
        setSettings({ ...defaultSettings, ...data });
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
    const nextSettings = { ...defaultSettings, ...data.settings };
    setSettings(nextSettings);
    return nextSettings;
  };

  const updateGlobalSettings = async (payload) => {
    const { data } = await api.put("/ui-settings/global", payload);
    const nextSettings = { ...defaultSettings, ...data.settings };
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
