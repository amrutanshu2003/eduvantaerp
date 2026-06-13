import AuditLog from "../models/AuditLog.js";
import UISettings from "../models/UISettings.js";
import bcrypt from "bcryptjs";

const defaultAcademicConfig = {
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
};

const defaultGlobalSettings = {
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
  privilegedRecoveryEnabled: false,
  privilegedRecoveryHint: "",
  customSidebarItems: [],
  academicConfig: defaultAcademicConfig,
};

const sanitizeSettings = (settings) => {
  if (!settings) {
    return defaultGlobalSettings;
  }

  const plainSettings = settings.toObject ? settings.toObject() : settings;
  const { privilegedRecoveryKeyHash, ...safeSettings } = plainSettings;
  return {
    ...defaultGlobalSettings,
    ...safeSettings,
    loginBackgroundImageUrl: safeSettings.loginBackgroundImageUrl || safeSettings.loginBackground || defaultGlobalSettings.loginBackgroundImageUrl,
  };
};

const clampOpacity = (value, fallback) => {
  const numericValue = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, 0), 1);
};

const getGlobalUISettings = async (req, res, next) => {
  try {
    const settings = await UISettings.findOne({ instituteId: null });

    res.json({
      settings: sanitizeSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

const updateGlobalUISettings = async (req, res, next) => {
  try {
    const payload = {
      appName: req.body.appName?.trim() || defaultGlobalSettings.appName,
      logo: req.body.logo?.trim() || "",
      favicon: req.body.favicon?.trim() || "",
      primaryColor: req.body.primaryColor?.trim() || defaultGlobalSettings.primaryColor,
      secondaryColor: req.body.secondaryColor?.trim() || defaultGlobalSettings.secondaryColor,
      sidebarColor: req.body.sidebarColor?.trim() || defaultGlobalSettings.sidebarColor,
      loginBackground:
        req.body.loginBackground?.trim() ||
        req.body.loginBackgroundImageUrl?.trim() ||
        "",
      loginBackgroundEnabled:
        typeof req.body.loginBackgroundEnabled === "boolean"
          ? req.body.loginBackgroundEnabled
          : defaultGlobalSettings.loginBackgroundEnabled,
      loginBackgroundImageUrl:
        req.body.loginBackgroundImageUrl?.trim() ||
        req.body.loginBackground?.trim() ||
        "",
      loginBackgroundOverlayEnabled:
        typeof req.body.loginBackgroundOverlayEnabled === "boolean"
          ? req.body.loginBackgroundOverlayEnabled
          : defaultGlobalSettings.loginBackgroundOverlayEnabled,
      loginBackgroundOverlayOpacity: clampOpacity(
        req.body.loginBackgroundOverlayOpacity,
        defaultGlobalSettings.loginBackgroundOverlayOpacity
      ),
      loginBackgroundBlurEnabled:
        typeof req.body.loginBackgroundBlurEnabled === "boolean"
          ? req.body.loginBackgroundBlurEnabled
          : defaultGlobalSettings.loginBackgroundBlurEnabled,
      loginPanelImageEnabled:
        typeof req.body.loginPanelImageEnabled === "boolean"
          ? req.body.loginPanelImageEnabled
          : defaultGlobalSettings.loginPanelImageEnabled,
      loginPanelImageUrl: req.body.loginPanelImageUrl?.trim() || "",
      loginPanelImagePosition:
        req.body.loginPanelImagePosition || defaultGlobalSettings.loginPanelImagePosition,
      loginPanelImageOverlayEnabled:
        typeof req.body.loginPanelImageOverlayEnabled === "boolean"
          ? req.body.loginPanelImageOverlayEnabled
          : defaultGlobalSettings.loginPanelImageOverlayEnabled,
      loginPanelImageOverlayOpacity: clampOpacity(
        req.body.loginPanelImageOverlayOpacity,
        defaultGlobalSettings.loginPanelImageOverlayOpacity
      ),
      loginBrandEyebrow: req.body.loginBrandEyebrow?.trim() || defaultGlobalSettings.loginBrandEyebrow,
      loginBrandSubtitle: req.body.loginBrandSubtitle?.trim() || defaultGlobalSettings.loginBrandSubtitle,
      loginHeroTitle: req.body.loginHeroTitle?.trim() || defaultGlobalSettings.loginHeroTitle,
      loginHeroDescription: req.body.loginHeroDescription?.trim() || defaultGlobalSettings.loginHeroDescription,
      loginLeftPanelAccentColor: req.body.loginLeftPanelAccentColor?.trim() || defaultGlobalSettings.loginLeftPanelAccentColor,
      loginLeftPanelAccentLightColor: req.body.loginLeftPanelAccentLightColor?.trim() || defaultGlobalSettings.loginLeftPanelAccentLightColor,
      loginHeroTitleColor: req.body.loginHeroTitleColor?.trim() || defaultGlobalSettings.loginHeroTitleColor,
      loginHeroTitleLightColor: req.body.loginHeroTitleLightColor?.trim() || defaultGlobalSettings.loginHeroTitleLightColor,
      loginHeroBodyColor: req.body.loginHeroBodyColor?.trim() || defaultGlobalSettings.loginHeroBodyColor,
      loginHeroBodyLightColor: req.body.loginHeroBodyLightColor?.trim() || defaultGlobalSettings.loginHeroBodyLightColor,
      loginFooterText: req.body.loginFooterText?.trim() || defaultGlobalSettings.loginFooterText,
      loginFooterTextColor: req.body.loginFooterTextColor?.trim() || defaultGlobalSettings.loginFooterTextColor,
      loginFooterTextLightColor: req.body.loginFooterTextLightColor?.trim() || defaultGlobalSettings.loginFooterTextLightColor,
      loginFormEyebrow: req.body.loginFormEyebrow?.trim() || defaultGlobalSettings.loginFormEyebrow,
      loginFormTitle: req.body.loginFormTitle?.trim() || defaultGlobalSettings.loginFormTitle,
      loginFormDescription: req.body.loginFormDescription?.trim() || defaultGlobalSettings.loginFormDescription,
      loginButtonText: req.body.loginButtonText?.trim() || defaultGlobalSettings.loginButtonText,
      showLoginBrandBlock:
        typeof req.body.showLoginBrandBlock === "boolean"
          ? req.body.showLoginBrandBlock
          : defaultGlobalSettings.showLoginBrandBlock,
      showLoginHeroTitle:
        typeof req.body.showLoginHeroTitle === "boolean"
          ? req.body.showLoginHeroTitle
          : defaultGlobalSettings.showLoginHeroTitle,
      showLoginHeroDescription:
        typeof req.body.showLoginHeroDescription === "boolean"
          ? req.body.showLoginHeroDescription
          : defaultGlobalSettings.showLoginHeroDescription,
      showLoginFeatureCards:
        typeof req.body.showLoginFeatureCards === "boolean"
          ? req.body.showLoginFeatureCards
          : defaultGlobalSettings.showLoginFeatureCards,
      showLoginCopyright:
        typeof req.body.showLoginCopyright === "boolean"
          ? req.body.showLoginCopyright
          : defaultGlobalSettings.showLoginCopyright,
      showLoginThemeToggle:
        typeof req.body.showLoginThemeToggle === "boolean"
          ? req.body.showLoginThemeToggle
          : defaultGlobalSettings.showLoginThemeToggle,
      showLoginAcceptedUsernameHint:
        typeof req.body.showLoginAcceptedUsernameHint === "boolean"
          ? req.body.showLoginAcceptedUsernameHint
          : defaultGlobalSettings.showLoginAcceptedUsernameHint,
      showLoginRememberMe:
        typeof req.body.showLoginRememberMe === "boolean"
          ? req.body.showLoginRememberMe
          : defaultGlobalSettings.showLoginRememberMe,
      loginFeatureCard1Enabled:
        typeof req.body.loginFeatureCard1Enabled === "boolean"
          ? req.body.loginFeatureCard1Enabled
          : defaultGlobalSettings.loginFeatureCard1Enabled,
      loginFeatureCard1Title: req.body.loginFeatureCard1Title?.trim() || defaultGlobalSettings.loginFeatureCard1Title,
      loginFeatureCard1Description:
        req.body.loginFeatureCard1Description?.trim() || defaultGlobalSettings.loginFeatureCard1Description,
      loginFeatureCard2Enabled:
        typeof req.body.loginFeatureCard2Enabled === "boolean"
          ? req.body.loginFeatureCard2Enabled
          : defaultGlobalSettings.loginFeatureCard2Enabled,
      loginFeatureCard2Title: req.body.loginFeatureCard2Title?.trim() || defaultGlobalSettings.loginFeatureCard2Title,
      loginFeatureCard2Description:
        req.body.loginFeatureCard2Description?.trim() || defaultGlobalSettings.loginFeatureCard2Description,
      loginCleanModeEnabled:
        typeof req.body.loginCleanModeEnabled === "boolean"
          ? req.body.loginCleanModeEnabled
          : defaultGlobalSettings.loginCleanModeEnabled,
      buttonStyle: req.body.buttonStyle || defaultGlobalSettings.buttonStyle,
      themeMode: req.body.themeMode || defaultGlobalSettings.themeMode,
      footerText: req.body.footerText?.trim() || defaultGlobalSettings.footerText,
      showFooter: typeof req.body.showFooter === "boolean" ? req.body.showFooter : defaultGlobalSettings.showFooter,
      captchaEnabled: typeof req.body.captchaEnabled === "boolean" ? req.body.captchaEnabled : defaultGlobalSettings.captchaEnabled,
      customSidebarItems: Array.isArray(req.body.customSidebarItems)
        ? req.body.customSidebarItems
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              label: item.label?.trim(),
              path: item.path?.trim(),
              iconKey: item.iconKey?.trim() || "info",
            }))
            .filter((item) => item.label && item.path)
        : defaultGlobalSettings.customSidebarItems,
      privilegedRecoveryEnabled:
        typeof req.body.privilegedRecoveryEnabled === "boolean"
          ? req.body.privilegedRecoveryEnabled
          : defaultGlobalSettings.privilegedRecoveryEnabled,
      privilegedRecoveryHint: req.body.privilegedRecoveryHint?.trim() || "",
      instituteId: null,
    };

    if (req.body.academicConfig && typeof req.body.academicConfig === "object") {
      const ac = req.body.academicConfig;
      payload.academicConfig = {
        school: {
          allowedSchoolLevels: Array.isArray(ac.school?.allowedSchoolLevels)
            ? ac.school.allowedSchoolLevels
            : defaultAcademicConfig.school.allowedSchoolLevels,
          maxClassNumber: typeof ac.school?.maxClassNumber === "number"
            ? ac.school.maxClassNumber
            : defaultAcademicConfig.school.maxClassNumber,
        },
        college: {
          allowedSchoolLevels: Array.isArray(ac.college?.allowedSchoolLevels)
            ? ac.college.allowedSchoolLevels
            : defaultAcademicConfig.college.allowedSchoolLevels,
          allowedProgramLevels: Array.isArray(ac.college?.allowedProgramLevels)
            ? ac.college.allowedProgramLevels
            : defaultAcademicConfig.college.allowedProgramLevels,
          maxClassNumber: typeof ac.college?.maxClassNumber === "number"
            ? ac.college.maxClassNumber
            : defaultAcademicConfig.college.maxClassNumber,
        },
        university: {
          allowedProgramLevels: Array.isArray(ac.university?.allowedProgramLevels)
            ? ac.university.allowedProgramLevels
            : defaultAcademicConfig.university.allowedProgramLevels,
        },
      };
    }

    if (!["rounded", "pill", "square"].includes(payload.buttonStyle)) {
      res.status(400);
      throw new Error("Button style must be rounded, pill, or square");
    }

    if (!["light", "dark", "system"].includes(payload.themeMode)) {
      res.status(400);
      throw new Error("Theme mode must be light, dark, or system");
    }

    if (!["background", "top", "hidden"].includes(payload.loginPanelImagePosition)) {
      res.status(400);
      throw new Error("Login panel image position must be background, top, or hidden");
    }

    if (req.body.clearPrivilegedRecoveryKey === true) {
      payload.privilegedRecoveryKeyHash = "";
      payload.privilegedRecoveryEnabled = false;
    } else if (req.body.privilegedRecoveryKey?.trim()) {
      payload.privilegedRecoveryKeyHash = await bcrypt.hash(req.body.privilegedRecoveryKey.trim(), 10);
    }

    const settings = await UISettings.findOneAndUpdate({ instituteId: null }, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: "update",
      module: "global_ui_settings",
      targetId: settings._id,
      targetType: "UISettings",
      metadata: { themeMode: settings.themeMode },
      ipAddress: req.ip,
    });

    res.json({
      message: "Global UI settings updated successfully",
      settings: sanitizeSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

export { getGlobalUISettings, updateGlobalUISettings, defaultGlobalSettings };
