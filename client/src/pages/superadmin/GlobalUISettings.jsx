import { useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiEdit2, FiImage, FiLayout, FiLayers, FiMove, FiPlus, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTrash2, FiUploadCloud } from "react-icons/fi";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import IconPicker from "../../components/ui/IconPicker";
import { useUISettings } from "../../context/UISettingsContext";
import { normalizeCustomSidebarItem, serializeCustomSidebarItem } from "../../utils/iconRegistry";

const ALL_SCHOOL_LEVELS = ["Pre-Primary", "Primary", "Middle", "Secondary", "Higher Secondary"];
const ALL_PROGRAM_LEVELS = ["UG", "PG", "PhD", "Diploma", "Certificate"];
const LOGIN_VISIBILITY_TOGGLES = [
  { name: "showLoginBrandBlock", label: "Show brand block", description: "Display logo, eyebrow, and subtitle in the login header." },
  { name: "showLoginHeroTitle", label: "Show hero title", description: "Display the main left-panel heading." },
  { name: "showLoginHeroDescription", label: "Show hero description", description: "Display supporting copy below the hero title." },
  { name: "showLoginFeatureCards", label: "Show feature cards", description: "Display compact marketing cards on the left panel." },
  { name: "showLoginCopyright", label: "Show copyright pill", description: "Display the footer/copyright text chip in the login panel." },
  { name: "showLoginThemeToggle", label: "Show theme toggle", description: "Keep the light/dark mode switch on the login form." },
  { name: "showLoginAcceptedUsernameHint", label: "Show username hint", description: "Show accepted username formats below the username field." },
  { name: "showLoginRememberMe", label: "Show remember me", description: "Display remember me and session status text." },
];
const SETTINGS_TABS = [
  { id: "branding", label: "Branding", icon: FiSettings, description: "App name, assets, colors and footer" },
  { id: "login", label: "Login", icon: FiLayout, description: "Auth branding, text, imagery and visibility" },
  { id: "security", label: "Security", icon: FiShield, description: "Captcha and admin recovery controls" },
  { id: "attendance", label: "Attendance", icon: FiCheckCircle, description: "Global attendance thresholds and tone colors" },
  { id: "academic", label: "Academic", icon: FiLayers, description: "Academic group configuration" },
  { id: "sidebar", label: "Sidebar", icon: FiSliders, description: "Custom navigation items" },
];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image"));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image"));
    image.src = src;
  });

const canvasToDataUrl = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to optimize the selected image"));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to encode the optimized image"));
        reader.readAsDataURL(blob);
      },
      type,
      quality
    );
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sanitizeLetterMark = (value, maxLength = 2) =>
  (value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, maxLength);

const createLetterMarkDataUrl = ({ text, primaryColor, secondaryColor, shape = "rounded-square", fontScale = 0.5 }) => {
  const safeText = sanitizeLetterMark(text, shape === "favicon" ? 1 : 2) || "E";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="${shape === "favicon" ? 28 : 34}" fill="url(#brandGradient)" />
      <text
        x="64"
        y="64"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Poppins, Segoe UI, Arial, sans-serif"
        font-size="${safeText.length > 1 ? 48 : 64}"
        font-weight="700"
        fill="#ffffff"
        letter-spacing="${safeText.length > 1 ? 1.5 : 0}"
      >
        ${safeText}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const cropImageToDataUrl = async (src, cropState) => {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const outputSize = cropState.kind === "favicon" ? 128 : 320;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Crop canvas is not available");
  }

  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const shortestSide = Math.min(naturalWidth, naturalHeight);
  const cropSize = shortestSide / cropState.zoom;
  const maxX = Math.max(0, naturalWidth - cropSize);
  const maxY = Math.max(0, naturalHeight - cropSize);
  const cropX = clamp((cropState.positionX / 100) * maxX, 0, maxX);
  const cropY = clamp((cropState.positionY / 100) * maxY, 0, maxY);

  context.clearRect(0, 0, outputSize, outputSize);
  context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);

  if (cropState.kind === "favicon") {
    return canvasToDataUrl(canvas, "image/png");
  }

  return canvasToDataUrl(canvas, "image/webp", 0.82);
};

const GlobalUISettings = () => {
  const { settings, updateGlobalSettings, refreshSettings, getButtonRadius, defaultSettings, resolvedTheme } = useUISettings();
  const [formData, setFormData] = useState(settings);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [activeTab, setActiveTab] = useState("branding");
  const [isTabsPinned, setIsTabsPinned] = useState(false);
  const [tabsDockStyle, setTabsDockStyle] = useState({ top: 72, left: 0, width: 0, height: 0 });
  const [recoveryKey, setRecoveryKey] = useState("");
  const [clearRecoveryKey, setClearRecoveryKey] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [customFieldInput, setCustomFieldInput] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({ label: "", path: "", icon: null });
  const [cropperState, setCropperState] = useState(null);
  const [logoLetterInput, setLogoLetterInput] = useState("");
  const [faviconLetterInput, setFaviconLetterInput] = useState("");
  const tabsAnchorRef = useRef(null);
  const tabsCardRef = useRef(null);

  useEffect(() => {
    setFormData({
      ...settings,
      customSidebarItems: Array.isArray(settings.customSidebarItems)
        ? settings.customSidebarItems.map(normalizeCustomSidebarItem)
        : [],
    });
    setRecoveryKey("");
    setClearRecoveryKey(false);
  }, [settings]);

  useEffect(() => {
    setLogoLetterInput("");
    setFaviconLetterInput("");
  }, [settings.logo, settings.favicon]);

  useEffect(() => {
    const scrollRoot = document.querySelector("[data-dashboard-scroll-root]");
    const navbar = document.querySelector("[data-dashboard-navbar]");

    if (!scrollRoot || !tabsAnchorRef.current) {
      return undefined;
    }

    const updatePinnedTabs = () => {
      if (!tabsAnchorRef.current) {
        return;
      }

      const anchorRect = tabsAnchorRef.current.getBoundingClientRect();
      const cardRect = tabsCardRef.current?.getBoundingClientRect();
      const navbarRect = navbar?.getBoundingClientRect();
      const pinTop = navbarRect ? Math.round(navbarRect.bottom) : 72;

      setTabsDockStyle({
        top: pinTop,
        left: Math.round(anchorRect.left),
        width: Math.round(anchorRect.width),
        height: Math.round(cardRect?.height || anchorRect.height),
      });

      setIsTabsPinned(anchorRect.top <= pinTop);
    };

    updatePinnedTabs();
    scrollRoot.addEventListener("scroll", updatePinnedTabs, { passive: true });
    window.addEventListener("resize", updatePinnedTabs);

    return () => {
      scrollRoot.removeEventListener("scroll", updatePinnedTabs);
      window.removeEventListener("resize", updatePinnedTabs);
    };
  }, [activeTab, resolvedTheme]);

  const isDark = resolvedTheme === "dark";

  const getDefaultFormData = () => ({
    ...defaultSettings,
    customSidebarItems: Array.isArray(defaultSettings.customSidebarItems)
      ? defaultSettings.customSidebarItems.map(normalizeCustomSidebarItem)
      : [],
  });

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const persistToggleUpdate = async (nextState, fieldName) => {
    try {
      await updateGlobalSettings({
        ...nextState,
        privilegedRecoveryHint: nextState.privilegedRecoveryHint || "",
      });
      setMessageTone("success");
      setMessage(`${fieldName} updated instantly.`);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to save toggle change");
      await refreshSettings();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleChange = (event) => {
    const { name, checked } = event.target;
    setFormData((current) => {
      const nextState = { ...current, [name]: checked };
      setSubmitting(true);
      void persistToggleUpdate(nextState, name.replace(/([A-Z])/g, " $1").trim());
      return nextState;
    });
  };

  const handleRangeChange = (event) => {
    const nextValue = Number.parseFloat(event.target.value);
    setFormData((current) => ({ ...current, [event.target.name]: Number.isNaN(nextValue) ? 0 : nextValue }));
  };

  const resetDraftSection = (section) => {
    const defaults = getDefaultFormData();

    const sectionResetMap = {
      branding: (current) => ({
        ...current,
        appName: defaults.appName,
        logo: defaults.logo,
        favicon: defaults.favicon,
        primaryColor: defaults.primaryColor,
        secondaryColor: defaults.secondaryColor,
        sidebarColor: defaults.sidebarColor,
        buttonStyle: defaults.buttonStyle,
        themeMode: defaults.themeMode,
        footerText: defaults.footerText,
        showFooter: defaults.showFooter,
      }),
      login: (current) => ({
        ...current,
        loginBackground: defaults.loginBackground,
        loginBackgroundEnabled: defaults.loginBackgroundEnabled,
        loginBackgroundImageUrl: defaults.loginBackgroundImageUrl,
        loginBackgroundOverlayEnabled: defaults.loginBackgroundOverlayEnabled,
        loginBackgroundOverlayOpacity: defaults.loginBackgroundOverlayOpacity,
        loginBackgroundBlurEnabled: defaults.loginBackgroundBlurEnabled,
        loginPanelImageEnabled: defaults.loginPanelImageEnabled,
        loginPanelImageUrl: defaults.loginPanelImageUrl,
        loginPanelImagePosition: defaults.loginPanelImagePosition,
        loginPanelImageOverlayEnabled: defaults.loginPanelImageOverlayEnabled,
        loginPanelImageOverlayOpacity: defaults.loginPanelImageOverlayOpacity,
        loginBrandEyebrow: defaults.loginBrandEyebrow,
        loginBrandSubtitle: defaults.loginBrandSubtitle,
        loginHeroTitle: defaults.loginHeroTitle,
        loginHeroDescription: defaults.loginHeroDescription,
        loginLeftPanelAccentColor: defaults.loginLeftPanelAccentColor,
        loginLeftPanelAccentLightColor: defaults.loginLeftPanelAccentLightColor,
        loginHeroTitleColor: defaults.loginHeroTitleColor,
        loginHeroTitleLightColor: defaults.loginHeroTitleLightColor,
        loginHeroBodyColor: defaults.loginHeroBodyColor,
        loginHeroBodyLightColor: defaults.loginHeroBodyLightColor,
        loginFooterText: defaults.loginFooterText,
        loginFooterTextColor: defaults.loginFooterTextColor,
        loginFooterTextLightColor: defaults.loginFooterTextLightColor,
        loginFormEyebrow: defaults.loginFormEyebrow,
        loginFormTitle: defaults.loginFormTitle,
        loginFormDescription: defaults.loginFormDescription,
        loginButtonText: defaults.loginButtonText,
        showLoginBrandBlock: defaults.showLoginBrandBlock,
        showLoginHeroTitle: defaults.showLoginHeroTitle,
        showLoginHeroDescription: defaults.showLoginHeroDescription,
        showLoginFeatureCards: defaults.showLoginFeatureCards,
        showLoginCopyright: defaults.showLoginCopyright,
        showLoginThemeToggle: defaults.showLoginThemeToggle,
        showLoginAcceptedUsernameHint: defaults.showLoginAcceptedUsernameHint,
        showLoginRememberMe: defaults.showLoginRememberMe,
        loginFeatureCard1Enabled: defaults.loginFeatureCard1Enabled,
        loginFeatureCard1Title: defaults.loginFeatureCard1Title,
        loginFeatureCard1Description: defaults.loginFeatureCard1Description,
        loginFeatureCard2Enabled: defaults.loginFeatureCard2Enabled,
        loginFeatureCard2Title: defaults.loginFeatureCard2Title,
        loginFeatureCard2Description: defaults.loginFeatureCard2Description,
        loginCleanModeEnabled: defaults.loginCleanModeEnabled,
        captchaEnabled: defaults.captchaEnabled,
      }),
      security: (current) => ({
        ...current,
        privilegedRecoveryEnabled: defaults.privilegedRecoveryEnabled,
        privilegedRecoveryHint: defaults.privilegedRecoveryHint,
      }),
      attendance: (current) => ({
        ...current,
        attendanceGoodThreshold: defaults.attendanceGoodThreshold,
        attendanceWarningThreshold: defaults.attendanceWarningThreshold,
        attendanceGoodColor: defaults.attendanceGoodColor,
        attendanceWarningColor: defaults.attendanceWarningColor,
        attendanceCriticalColor: defaults.attendanceCriticalColor,
      }),
      academic: (current) => ({
        ...current,
        academicConfig: defaults.academicConfig,
      }),
      sidebar: (current) => ({
        ...current,
        customSidebarItems: defaults.customSidebarItems,
      }),
    };

    if (sectionResetMap[section]) {
      setFormData((current) => sectionResetMap[section](current));
      if (section === "security") {
        setRecoveryKey("");
        setClearRecoveryKey(false);
      }
      if (section === "sidebar") {
        setNewMenuItem({ label: "", path: "", icon: null });
      }
      setMessageTone("success");
      setMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} section draft reset to default values. Save to apply.`);
      return;
    }

    setFormData(getDefaultFormData());
    setRecoveryKey("");
    setClearRecoveryKey(false);
    setNewMenuItem({ label: "", path: "", icon: null });
    setMessageTone("success");
    setMessage("All settings draft reset to default values. Save to apply.");
  };

  const handleImageUpload = async (event) => {
    const { name, files } = event.target;
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessageTone("error");
      setMessage("Please select a valid image file.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropperState({
        field: name,
        kind: name === "favicon" ? "favicon" : "logo",
        source: dataUrl,
        zoom: 1,
        positionX: 50,
        positionY: 50,
        fileName: file.name,
      });
      setMessage("");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.message || "Unable to load the selected image.");
    } finally {
      event.target.value = "";
    }
  };

  const handleDirectImageUpload = async (event) => {
    const { name, files } = event.target;
    const file = files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessageTone("error");
      setMessage("Please select a valid image file.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((current) => ({ ...current, [name]: dataUrl }));
      setMessageTone("success");
      setMessage("Image uploaded successfully. Save settings to apply it.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error.message || "Unable to load the selected image.");
    } finally {
      event.target.value = "";
    }
  };

  const cropPreviewStyle = useMemo(() => {
    if (!cropperState?.source) {
      return {};
    }

    const zoom = cropperState.zoom;
    const translateX = (cropperState.positionX - 50) * 1.6;
    const translateY = (cropperState.positionY - 50) * 1.6;

    return {
      backgroundImage: `url(${cropperState.source})`,
      backgroundPosition: `${50 - translateX}% ${50 - translateY}%`,
      backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
      backgroundRepeat: "no-repeat",
    };
  }, [cropperState]);

  const closeCropper = () => {
    setCropperState(null);
  };

  const applyCroppedImage = async () => {
    if (!cropperState) {
      return;
    }

    try {
      const croppedDataUrl = await cropImageToDataUrl(cropperState.source, cropperState);
      setFormData((current) => ({ ...current, [cropperState.field]: croppedDataUrl }));
      setMessageTone("success");
      setMessage(
        `${cropperState.kind === "favicon" ? "Favicon" : "ERP icon"} cropped successfully. Save settings to apply the updated image.`
      );
      closeCropper();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.message || "Unable to crop the selected image.");
    }
  };

  const applyLetterMark = (field) => {
    const rawValue = field === "favicon" ? faviconLetterInput : logoLetterInput;
    const maxLength = field === "favicon" ? 1 : 2;
    const cleanedValue = sanitizeLetterMark(rawValue, maxLength);

    if (!cleanedValue) {
      setMessageTone("error");
      setMessage(`Please enter ${field === "favicon" ? "one" : "one or two"} English letter${field === "favicon" ? "" : "s"} first.`);
      return;
    }

    const dataUrl = createLetterMarkDataUrl({
      text: cleanedValue,
      primaryColor: formData.primaryColor || "#0f766e",
      secondaryColor: formData.secondaryColor || "#14b8a6",
      shape: field === "favicon" ? "favicon" : "rounded-square",
    });

    setFormData((current) => ({ ...current, [field]: dataUrl }));
    setMessageTone("success");
    setMessage(`${field === "favicon" ? "Favicon" : "ERP icon"} letter mark applied. Save settings to use it across the ERP.`);
  };

  const handleAcademicCheckbox = (instituteType, field, value, checked) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const prevList = prevType[field] || [];
      const nextList = checked ? [...prevList, value] : prevList.filter((v) => v !== value);
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [field]: nextList,
          },
        },
      };
    });
  };

  const handleAcademicNumber = (instituteType, field, value) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [field]: parseInt(value, 10) || 1,
          },
        },
      };
    });
  };

  const handleAddCustomField = (instituteType, field) => {
    if (!customFieldInput.trim()) return;
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const customFieldsKey = `${field}CustomFields`;
      const prevCustomFields = prevType[customFieldsKey] || [];
      if (prevCustomFields.includes(customFieldInput.trim())) return current;
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [customFieldsKey]: [...prevCustomFields, customFieldInput.trim()],
          },
        },
      };
    });
    setCustomFieldInput("");
  };

  const handleRemoveCustomField = (instituteType, field, value) => {
    setFormData((current) => {
      const prev = current.academicConfig || {};
      const prevType = prev[instituteType] || {};
      const customFieldsKey = `${field}CustomFields`;
      const prevCustomFields = prevType[customFieldsKey] || [];
      return {
        ...current,
        academicConfig: {
          ...prev,
          [instituteType]: {
            ...prevType,
            [customFieldsKey]: prevCustomFields.filter((v) => v !== value),
          },
        },
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await updateGlobalSettings({
        ...formData,
        customSidebarItems: (formData.customSidebarItems || []).map(serializeCustomSidebarItem),
        privilegedRecoveryKey: recoveryKey,
        clearPrivilegedRecoveryKey: clearRecoveryKey,
      });
      setMessageTone("success");
      setMessage("Global UI settings updated successfully");
      await refreshSettings();
      setRecoveryKey("");
      setClearRecoveryKey(false);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to update UI settings");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
      isDark
        ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
    }`;

  const ac = formData.academicConfig || {};

  const togglePanel = (panel) => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  };

  const renderCheckboxGroup = (instituteType, field, allValues) => {
    const currentList = ac[instituteType]?.[field] || [];
    return (
      <div className="flex flex-wrap gap-3">
        {allValues.map((val) => {
          const isChecked = currentList.includes(val);
          return (
            <label
              key={val}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                isChecked
                  ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleAcademicCheckbox(instituteType, field, val, e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-all ${
                  isChecked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {isChecked && "✓"}
              </span>
              {val}
            </label>
          );
        })}
      </div>
    );
  };

  const renderCustomFields = (instituteType, field) => {
    const customFieldsKey = `${field}CustomFields`;
    const customFields = ac[instituteType]?.[customFieldsKey] || [];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {customFields.map((customField) => (
            <div
              key={customField}
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
            >
              {customField}
              <button
                type="button"
                onClick={() => handleRemoveCustomField(instituteType, field, customField)}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-indigo-600 hover:bg-indigo-300 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customFieldInput}
            onChange={(e) => setCustomFieldInput(e.target.value)}
            placeholder="Add custom field (e.g., Science, Arts)"
            className={`${inputClassName} flex-1`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomField(instituteType, field);
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleAddCustomField(instituteType, field)}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const handleAddCustomMenuItem = () => {
    if (!newMenuItem.label || !newMenuItem.path || !newMenuItem.icon) return;
    
    setFormData((current) => ({
      ...current,
      customSidebarItems: [...(current.customSidebarItems || []), normalizeCustomSidebarItem(newMenuItem)],
    }));
    setNewMenuItem({ label: "", path: "", icon: null });
  };

  const handleRemoveCustomMenuItem = (index) => {
    setFormData((current) => ({
      ...current,
      customSidebarItems: current.customSidebarItems?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleIconSelect = (icon) => {
    const normalizedIcon = {
      key: icon.key,
      name: icon.name,
      component: icon.component,
    };

    if (editingIconIndex !== null) {
      setFormData((current) => ({
        ...current,
        customSidebarItems: current.customSidebarItems?.map((item, i) =>
          i === editingIconIndex ? normalizeCustomSidebarItem({ ...item, iconKey: normalizedIcon.key }) : item
        ) || [],
      }));
      setEditingIconIndex(null);
    } else {
      setNewMenuItem((current) => ({ ...current, icon: normalizedIcon, iconKey: normalizedIcon.key }));
    }
    setIconPickerOpen(false);
  };

  const openIconPicker = (index = null) => {
    setEditingIconIndex(index);
    setIconPickerOpen(true);
  };

  const renderPanelHeader = (label, icon, panelKey, badgeCount) => {
    const isOpen = expandedPanel === panelKey;
    return (
      <button
        type="button"
        onClick={() => togglePanel(panelKey)}
        className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${formData.primaryColor}18`, color: formData.primaryColor }}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{badgeCount} level{badgeCount !== 1 ? "s" : ""} enabled</p>
          </div>
        </div>
        <span className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
    );
  };

  const schoolLevelsCount = (ac.school?.allowedSchoolLevels || []).length;
  const collegeLevelsCount = (ac.college?.allowedSchoolLevels || []).length + (ac.college?.allowedProgramLevels || []).length;
  const uniLevelsCount = (ac.university?.allowedProgramLevels || []).length;
  const brandUploadCardClass =
    `rounded-[1.5rem] border p-4 ${isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50/80"}`;
  const toggleCardClass = `rounded-[1.25rem] border p-4 ${isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-slate-50/70"}`;
  const activeTabMeta = SETTINGS_TABS.find((tab) => tab.id === activeTab) || SETTINGS_TABS[0];
  const tabSectionClass = `rounded-[1.6rem] border p-5 ${isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50/70"}`;
  const fieldLabelClass = isDark ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700";
  const fieldMetaClass = isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500";
  const miniLabelClass = isDark ? "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500" : "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400";

  const renderSwitch = (name, checked, compact = false) => (
    <label className={`relative inline-flex cursor-pointer items-center ${compact ? "" : ""}`}>
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        onChange={handleToggleChange}
        className="peer sr-only"
      />
      <span
        className={`rounded-full transition-colors duration-200 ${compact ? "h-7 w-14" : "h-8 w-[3.75rem]"}`}
        style={{ backgroundColor: checked ? formData.primaryColor : isDark ? "#334155" : "#cbd5e1" }}
      />
      <span
        className={`absolute rounded-full bg-white shadow-sm transition-transform duration-200 ${compact ? "left-1 top-1 h-5 w-5" : "left-1 top-1 h-6 w-6"} ${
          checked ? (compact ? "translate-x-7" : "translate-x-7") : "translate-x-0"
        }`}
      />
    </label>
  );

  return (
    <section className={`ui-settings-shell space-y-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      <PageHeader
        eyebrow="Super Admin"
        title="Global UI Settings"
        description="Customize the shared application branding and theme values used across the ERP. Updating the app name here will refresh the brand name anywhere it is connected."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div ref={tabsAnchorRef} style={{ minHeight: isTabsPinned ? `${tabsDockStyle.height}px` : undefined }}>
        <div
          ref={tabsCardRef}
          className={`border backdrop-blur-xl transition-all duration-300 ${
            isTabsPinned ? "rounded-[1.1rem] px-2 py-2" : "rounded-[1.75rem] px-3 py-3"
          } ${
            isDark
              ? "border-slate-700/60 bg-slate-950/85 shadow-lg shadow-black/10"
              : "border-slate-200/90 bg-white/92 shadow-lg shadow-slate-200/40"
          }`}
          style={
            isTabsPinned
              ? {
                  position: "fixed",
                  top: `${tabsDockStyle.top}px`,
                  left: `${tabsDockStyle.left}px`,
                  width: `${tabsDockStyle.width}px`,
                  zIndex: 30,
                }
              : undefined
          }
        >
          <div className={`flex items-center justify-between gap-3 px-1 transition-all duration-300 ${isTabsPinned ? "mb-0 max-h-0 overflow-hidden opacity-0" : "mb-3 opacity-100"}`}>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Sections</p>
              <p className={`mt-1 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Quick access settings tabs</p>
            </div>
          </div>

          <div className={`-mx-1 overflow-x-auto px-1 no-scrollbar md:overflow-visible md:px-0 ${isTabsPinned ? "pb-0" : "pb-1 md:pb-0"}`}>
            <div className={`flex min-w-max md:min-w-0 ${isTabsPinned ? "gap-2 md:grid md:grid-cols-5 md:gap-2 xl:grid-cols-5" : "gap-3 md:grid md:grid-cols-3 md:gap-3 xl:grid-cols-5"}`}>
              {SETTINGS_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative min-w-[230px] snap-start border text-left transition-all duration-300 md:min-w-0 ${
                      isTabsPinned ? "rounded-[1rem] px-3 py-2.5" : "rounded-[1.35rem] px-4 py-3"
                    } ${
                      isActive
                        ? "border-transparent text-white shadow-lg"
                        : isDark
                          ? "border-slate-700 bg-slate-900/95 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
                          : "border-slate-200 bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, ${formData.sidebarColor} 0%, ${formData.primaryColor} 100%)` } : undefined}
                  >
                    <span
                      className={`absolute inset-x-4 top-0 h-px transition-opacity ${isActive ? "bg-white/50 opacity-100" : isDark ? "bg-slate-700 opacity-40 group-hover:opacity-80" : "bg-slate-200 opacity-70 group-hover:opacity-100"}`}
                    />
                    <div className={`flex ${isTabsPinned ? "items-center justify-center" : "flex-col items-start gap-3"}`}>
                      <span
                        className={`flex shrink-0 items-center justify-center transition-all ${
                          isTabsPinned ? "h-10 w-10 rounded-xl" : "h-11 w-11 rounded-2xl"
                        } ${
                          isActive
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : isDark
                              ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700"
                              : "bg-white text-slate-500 ring-1 ring-slate-200"
                        }`}
                      >
                        <TabIcon size={18} />
                      </span>
                      <div className={`min-w-0 transition-all duration-200 ${isTabsPinned ? "hidden" : "block"}`}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{tab.label}</p>
                          {isActive ? <span className="h-2 w-2 rounded-full bg-white/80" /> : null}
                        </div>
                        <p className={`mt-1 text-xs leading-5 ${isActive ? "text-white/75" : isDark ? "text-slate-400" : "text-slate-500"}`}>{tab.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleSubmit} className={`rounded-[1.75rem] border p-6 shadow-card ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border px-4 py-3 ${isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-slate-50/80"}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Editing</p>
              <p className={`mt-1 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{activeTabMeta.label}</p>
              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{activeTabMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab !== "login" && activeTab !== "academic" && activeTab !== "sidebar" && activeTab !== "branding" && activeTab !== "security" && activeTab !== "attendance" ? null : (
                <button
                  type="button"
                  onClick={() => resetDraftSection(activeTab)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition ${isDark ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-600 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <FiRefreshCw size={14} />
                  {`Reset ${activeTabMeta.label}`}
                </button>
              )}
              <button
                type="button"
                onClick={() => resetDraftSection("all")}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition ${isDark ? "border-rose-900/60 bg-rose-950/40 text-rose-200 hover:bg-rose-950/60" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
              >
                <FiRefreshCw size={14} />
                Reset All Draft
              </button>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {activeTab === "branding" ? (
            <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Institute / App Name</label>
              <input
                name="appName"
                value={formData.appName || ""}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Enter the ERP name to show across the app"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Change this once and every connected branding area like the login page, sidebar, navbar, admin dashboard, and browser tab title will use the new name.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Brand Assets</label>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className={brandUploadCardClass}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">ERP Icon / Logo</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Upload any size image, crop it square, and use it across branding areas or keep a hosted image URL.
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                      {formData.logo ? (
                        <img src={formData.logo} alt="ERP icon preview" className="h-full w-full object-cover" />
                      ) : (
                        <FiImage className="text-slate-400" size={20} />
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      id="global-ui-logo-upload"
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="global-ui-logo-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <FiUploadCloud size={15} />
                      Upload ERP Icon
                    </label>
                    <span className="text-xs text-slate-400">Crop before apply</span>
                    {formData.logo ? (
                      <button
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, logo: "" }))}
                        className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Letter Logo
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={logoLetterInput}
                        onChange={(event) => setLogoLetterInput(sanitizeLetterMark(event.target.value, 2))}
                        placeholder="E or ER"
                        className={inputClassName}
                        maxLength={2}
                      />
                      <button
                        type="button"
                        onClick={() => applyLetterMark("logo")}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Apply Letter Logo
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Use one or two English letters for a clean monogram logo.</p>
                  </div>
                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Logo URL</label>
                    <input
                      name="logo"
                      value={formData.logo || ""}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="https://example.com/erp-icon.png"
                    />
                  </div>
                </div>

                <div className={brandUploadCardClass}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Browser Favicon</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Upload any large image, crop it square, and it will be optimized for the browser tab icon.
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                      {formData.favicon ? (
                        <img src={formData.favicon} alt="Favicon preview" className="h-full w-full object-cover" />
                      ) : (
                        <FiImage className="text-slate-400" size={20} />
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      id="global-ui-favicon-upload"
                      type="file"
                      name="favicon"
                      accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="global-ui-favicon-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <FiUploadCloud size={15} />
                      Upload Favicon
                    </label>
                    <span className="text-xs text-slate-400">Large image supported</span>
                    {formData.favicon ? (
                      <button
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, favicon: "" }))}
                        className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Letter Favicon
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={faviconLetterInput}
                        onChange={(event) => setFaviconLetterInput(sanitizeLetterMark(event.target.value, 1))}
                        placeholder="E"
                        className={inputClassName}
                        maxLength={1}
                      />
                      <button
                        type="button"
                        onClick={() => applyLetterMark("favicon")}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Apply Letter Favicon
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Use a single bold English letter for the browser tab icon.</p>
                  </div>
                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Favicon URL</label>
                    <input
                      name="favicon"
                      value={formData.favicon || ""}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Primary Color</label>
              <input name="primaryColor" type="color" value={formData.primaryColor || "#0f766e"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Secondary Color</label>
              <input name="secondaryColor" type="color" value={formData.secondaryColor || "#f59e0b"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Sidebar Color</label>
              <input name="sidebarColor" type="color" value={formData.sidebarColor || "#0f172a"} onChange={handleChange} className={`${inputClassName} h-12`} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Theme Mode</label>
              <select name="themeMode" value={formData.themeMode || "system"} onChange={handleChange} className={inputClassName}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Button Style</label>
              <select name="buttonStyle" value={formData.buttonStyle || "rounded"} onChange={handleChange} className={inputClassName}>
                <option value="rounded">Rounded</option>
                <option value="pill">Pill</option>
                <option value="square">Square</option>
              </select>
            </div>
            </>
            ) : null}
            {activeTab === "login" ? (
            <>
            <div className="md:col-span-2">
              <div className={tabSectionClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Login Page Branding</h2>
                    <p className={fieldMetaClass}>
                      Control login page background, left panel imagery, text content, clean mode, and visibility toggles from one place.
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? "bg-slate-950 text-slate-100 ring-1 ring-slate-700" : "bg-slate-900 text-white"}`}>
                    Global Auth UI
                  </span>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className={brandUploadCardClass}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Page Background Image</p>
                        <p className={`mt-1 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Use a full-page login background with an adaptive overlay for dark and light themes.
                        </p>
                      </div>
                      <div className={`h-16 w-20 overflow-hidden rounded-2xl border ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                        {formData.loginBackgroundImageUrl ? (
                          <img src={formData.loginBackgroundImageUrl} alt="Login background preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400"><FiImage size={18} /></div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {renderSwitch("loginBackgroundEnabled", formData.loginBackgroundEnabled, true)}
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Enable background image</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <input
                        id="login-background-upload"
                        type="file"
                        name="loginBackgroundImageUrl"
                        accept="image/*"
                        onChange={handleDirectImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="login-background-upload"
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed px-4 py-2.5 text-xs font-semibold transition ${isDark ? "border-slate-600 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-900" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"}`}
                      >
                        <FiUploadCloud size={15} />
                        Upload Background
                      </label>
                      {formData.loginBackgroundImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, loginBackgroundImageUrl: "", loginBackground: "" }))}
                          className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={miniLabelClass}>Background Image URL</label>
                        <input
                          name="loginBackgroundImageUrl"
                          value={formData.loginBackgroundImageUrl || ""}
                          onChange={handleChange}
                          className={inputClassName}
                          placeholder="https://example.com/login-background.jpg"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className={toggleCardClass}>
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Overlay</p>
                              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Keep the form readable above the image.</p>
                            </div>
                            <div className="flex justify-start">
                              {renderSwitch("loginBackgroundOverlayEnabled", formData.loginBackgroundOverlayEnabled, true)}
                            </div>
                          </div>
                        </div>
                        <div className={toggleCardClass}>
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Blur Assist</p>
                              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Slightly softens image-heavy backgrounds.</p>
                            </div>
                            <div className="flex justify-start">
                              {renderSwitch("loginBackgroundBlurEnabled", formData.loginBackgroundBlurEnabled, true)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <label className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Overlay Opacity</label>
                          <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{Math.round((formData.loginBackgroundOverlayOpacity ?? 0.72) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          name="loginBackgroundOverlayOpacity"
                          value={formData.loginBackgroundOverlayOpacity ?? 0.72}
                          onChange={handleRangeChange}
                          className="mt-3 w-full accent-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={brandUploadCardClass}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Left Panel / Marketing Image</p>
                        <p className={`mt-1 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Add a campus image as a panel background or compact banner above the marketing copy.
                        </p>
                      </div>
                      <div className={`h-16 w-20 overflow-hidden rounded-2xl border ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                        {formData.loginPanelImageUrl ? (
                          <img src={formData.loginPanelImageUrl} alt="Login panel preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400"><FiImage size={18} /></div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {renderSwitch("loginPanelImageEnabled", formData.loginPanelImageEnabled, true)}
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Enable panel image</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <input
                        id="login-panel-image-upload"
                        type="file"
                        name="loginPanelImageUrl"
                        accept="image/*"
                        onChange={handleDirectImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="login-panel-image-upload"
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed px-4 py-2.5 text-xs font-semibold transition ${isDark ? "border-slate-600 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-900" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"}`}
                      >
                        <FiUploadCloud size={15} />
                        Upload Panel Image
                      </label>
                      {formData.loginPanelImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, loginPanelImageUrl: "" }))}
                          className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={miniLabelClass}>Panel Image URL</label>
                        <input
                          name="loginPanelImageUrl"
                          value={formData.loginPanelImageUrl || ""}
                          onChange={handleChange}
                          className={inputClassName}
                          placeholder="https://example.com/campus-image.jpg"
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Image Position</label>
                        <select name="loginPanelImagePosition" value={formData.loginPanelImagePosition || "hidden"} onChange={handleChange} className={inputClassName}>
                          <option value="background">Background</option>
                          <option value="top">Top banner</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </div>
                      <div className={toggleCardClass}>
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Panel Image Overlay</p>
                            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Adds contrast over the left panel image.</p>
                          </div>
                          <div className="flex justify-start">
                            {renderSwitch("loginPanelImageOverlayEnabled", formData.loginPanelImageOverlayEnabled, true)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <label className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Panel Overlay Opacity</label>
                          <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{Math.round((formData.loginPanelImageOverlayOpacity ?? 0.36) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          name="loginPanelImageOverlayOpacity"
                          value={formData.loginPanelImageOverlayOpacity ?? 0.36}
                          onChange={handleRangeChange}
                          className="mt-3 w-full accent-teal-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className={brandUploadCardClass}>
                    <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Login Text Content</p>
                    <p className={`mt-1 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Edit the brand line, hero message, and form messaging shown on the login page.
                    </p>
                    <div className="mt-4 grid gap-4">
                      <input name="loginBrandEyebrow" value={formData.loginBrandEyebrow || ""} onChange={handleChange} className={inputClassName} placeholder="Brand eyebrow" />
                      <input name="loginBrandSubtitle" value={formData.loginBrandSubtitle || ""} onChange={handleChange} className={inputClassName} placeholder="Brand subtitle" />
                      <textarea name="loginHeroTitle" value={formData.loginHeroTitle || ""} onChange={handleChange} rows="2" className={`${inputClassName} resize-none`} placeholder="Hero title" />
                      <textarea name="loginHeroDescription" value={formData.loginHeroDescription || ""} onChange={handleChange} rows="3" className={`${inputClassName} resize-none`} placeholder="Hero description" />
                      <textarea name="loginFooterText" value={formData.loginFooterText || ""} onChange={handleChange} rows="2" className={`${inputClassName} resize-none`} placeholder="Bottom footer card text" />
                      <input name="loginFormEyebrow" value={formData.loginFormEyebrow || ""} onChange={handleChange} className={inputClassName} placeholder="Form eyebrow" />
                      <input name="loginFormTitle" value={formData.loginFormTitle || ""} onChange={handleChange} className={inputClassName} placeholder="Form title" />
                      <textarea name="loginFormDescription" value={formData.loginFormDescription || ""} onChange={handleChange} rows="3" className={`${inputClassName} resize-none`} placeholder="Form description" />
                      <input name="loginButtonText" value={formData.loginButtonText || ""} onChange={handleChange} className={inputClassName} placeholder="Login button text" />
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div>
                        <label className={miniLabelClass}>Accent Dark Mode</label>
                        <input
                          name="loginLeftPanelAccentColor"
                          type="color"
                          value={formData.loginLeftPanelAccentColor || "#ccfbf1"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Accent Light Mode</label>
                        <input
                          name="loginLeftPanelAccentLightColor"
                          type="color"
                          value={formData.loginLeftPanelAccentLightColor || "#f0fdfa"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Hero Title Dark</label>
                        <input
                          name="loginHeroTitleColor"
                          type="color"
                          value={formData.loginHeroTitleColor || "#ffffff"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Hero Title Light</label>
                        <input
                          name="loginHeroTitleLightColor"
                          type="color"
                          value={formData.loginHeroTitleLightColor || "#f8fafc"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Hero Body Dark</label>
                        <input
                          name="loginHeroBodyColor"
                          type="color"
                          value={formData.loginHeroBodyColor || "#e2e8f0"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Hero Body Light</label>
                        <input
                          name="loginHeroBodyLightColor"
                          type="color"
                          value={formData.loginHeroBodyLightColor || "#f8fafc"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Footer Text Dark</label>
                        <input
                          name="loginFooterTextColor"
                          type="color"
                          value={formData.loginFooterTextColor || "#e2e8f0"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                      <div>
                        <label className={miniLabelClass}>Footer Text Light</label>
                        <input
                          name="loginFooterTextLightColor"
                          type="color"
                          value={formData.loginFooterTextLightColor || "#f8fafc"}
                          onChange={handleChange}
                          className={`${inputClassName} h-12`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={brandUploadCardClass}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Visibility & Clean Mode</p>
                        <p className={`mt-1 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Toggle optional sections without leaving awkward gaps in the auth card layout.
                        </p>
                      </div>
                      <div className={`flex items-center gap-3 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "bg-slate-800 text-slate-100" : "bg-slate-900 text-white"}`}>
                        {renderSwitch("loginCleanModeEnabled", formData.loginCleanModeEnabled, true)}
                        Clean Mode
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {LOGIN_VISIBILITY_TOGGLES.map((toggle) => (
                        <div key={toggle.name} className={toggleCardClass}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>{toggle.label}</p>
                              <p className={`mt-1 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{toggle.description}</p>
                            </div>
                            {renderSwitch(toggle.name, formData[toggle.name], true)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className={brandUploadCardClass}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Feature Card 1</p>
                      {renderSwitch("loginFeatureCard1Enabled", formData.loginFeatureCard1Enabled, true)}
                    </div>
                    <div className="mt-4 grid gap-4">
                      <input name="loginFeatureCard1Title" value={formData.loginFeatureCard1Title || ""} onChange={handleChange} className={inputClassName} placeholder="Feature card 1 title" />
                      <textarea name="loginFeatureCard1Description" value={formData.loginFeatureCard1Description || ""} onChange={handleChange} rows="3" className={`${inputClassName} resize-none`} placeholder="Feature card 1 description" />
                    </div>
                  </div>
                  <div className={brandUploadCardClass}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Feature Card 2</p>
                      {renderSwitch("loginFeatureCard2Enabled", formData.loginFeatureCard2Enabled, true)}
                    </div>
                    <div className="mt-4 grid gap-4">
                      <input name="loginFeatureCard2Title" value={formData.loginFeatureCard2Title || ""} onChange={handleChange} className={inputClassName} placeholder="Feature card 2 title" />
                      <textarea name="loginFeatureCard2Description" value={formData.loginFeatureCard2Description || ""} onChange={handleChange} rows="3" className={`${inputClassName} resize-none`} placeholder="Feature card 2 description" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${tabSectionClass} md:col-span-2`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Show Captcha On Login Page</p>
                  <p className={fieldMetaClass}>
                    Turn this on if you want the login page to require captcha verification.
                  </p>
                </div>
                {renderSwitch("captchaEnabled", formData.captchaEnabled, true)}
              </div>
            </div>
            </>
            ) : null}
            {activeTab === "security" ? (
            <div className={`${tabSectionClass} md:col-span-2`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Enable Secure Admin Recovery URL</p>
                  <p className={fieldMetaClass}>
                    Let Admin and Super Admin recover their own password from a hidden URL using email, mobile number, and a separate recovery key.
                  </p>
                </div>
                {renderSwitch("privilegedRecoveryEnabled", formData.privilegedRecoveryEnabled, true)}
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={fieldLabelClass}>Recovery Key Hint</label>
                  <input
                    name="privilegedRecoveryHint"
                    value={formData.privilegedRecoveryHint || ""}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Example: Owner recovery phrase"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Set New Recovery Key</label>
                  <input
                    type="password"
                    value={recoveryKey}
                    onChange={(event) => setRecoveryKey(event.target.value)}
                    className={inputClassName}
                    placeholder="Enter a separate secret recovery key"
                  />
                </div>
              </div>
              <label className={`mt-4 flex items-center gap-3 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <input
                  type="checkbox"
                  checked={clearRecoveryKey}
                  onChange={(event) => setClearRecoveryKey(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Clear existing recovery key and disable secure recovery
              </label>
              <p className={`mt-3 text-xs leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Hidden recovery URLs: <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>/secure/super-admin/recovery</span> and <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>/secure/account-recovery</span>
              </p>
            </div>
            ) : null}
            {activeTab === "attendance" ? (
            <>
            <div className={`${tabSectionClass} md:col-span-2`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
                  <FiAlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Global attendance thresholds</p>
                  <p className={fieldMetaClass}>
                    Set the minimum attendance requirement and the warning threshold used across student, parent, and admin attendance panels.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={fieldLabelClass}>Good Standing Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="attendanceGoodThreshold"
                    value={formData.attendanceGoodThreshold ?? 80}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                  <p className={fieldMetaClass}>Students at or above this percentage show green/good status. Example: `80`.</p>
                </div>
                <div>
                  <label className={fieldLabelClass}>Warning Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="attendanceWarningThreshold"
                    value={formData.attendanceWarningThreshold ?? 60}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                  <p className={fieldMetaClass}>Students between warning and good threshold show yellow/attention status. Below this becomes red.</p>
                </div>
              </div>
            </div>

            <div className={`${tabSectionClass} md:col-span-2`}>
              <div className="mb-4">
                <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Attendance status colors</p>
                <p className={fieldMetaClass}>
                  Choose the colors used for good, warning, and critical attendance indicators in the ERP panels.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { field: "attendanceGoodColor", label: "Good color" },
                  { field: "attendanceWarningColor", label: "Warning color" },
                  { field: "attendanceCriticalColor", label: "Critical color" },
                ].map((item) => (
                  <div key={item.field} className={`rounded-[1.25rem] border p-4 ${isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
                    <label className={fieldLabelClass}>{item.label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name={item.field}
                        value={formData[item.field] || "#000000"}
                        onChange={handleChange}
                        className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-transparent p-1"
                      />
                      <input
                        type="text"
                        name={item.field}
                        value={formData[item.field] || ""}
                        onChange={handleChange}
                        className={inputClassName}
                        placeholder="#000000"
                      />
                    </div>
                    <div className="mt-3 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: `${formData[item.field] || "#000000"}55`, backgroundColor: `${formData[item.field] || "#000000"}18`, color: formData[item.field] || "#000000" }}>
                      Preview
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            ) : null}
            {activeTab === "branding" ? (
            <>
            <div className="md:col-span-2">
              <label className={fieldLabelClass}>Footer Text</label>
              <textarea
                name="footerText"
                value={formData.footerText || ""}
                onChange={handleChange}
                rows="3"
                className={`${inputClassName} resize-none`}
              />
            </div>
            <div className={`${tabSectionClass} md:col-span-2`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>Show Footer</p>
                  <p className={fieldMetaClass}>
                    Turn this off if you want to hide the ERP footer across dashboard pages.
                  </p>
                </div>
                {renderSwitch("showFooter", formData.showFooter, true)}
              </div>
            </div>
            </>
            ) : null}
          </div>

          {/* Academic Group Configuration */}
          {activeTab === "academic" ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Academic Group Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">
                Control which academic levels and options are available when creating academic groups for each institute type.
              </p>
            </div>

            <div className="space-y-3">
              {/* School Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("School", "🏫", "school", schoolLevelsCount)}
                {expandedPanel === "school" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed School Levels</p>
                      {renderCheckboxGroup("school", "allowedSchoolLevels", ALL_SCHOOL_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom School Levels</p>
                      {renderCustomFields("school", "allowedSchoolLevels")}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Max Class Number</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={ac.school?.maxClassNumber || 10}
                        onChange={(e) => handleAcademicNumber("school", "maxClassNumber", e.target.value)}
                        className={`${inputClassName} max-w-[160px]`}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Defines the maximum class number (e.g. 10 = Class 1 to Class 10)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* College Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("College", "🎓", "college", collegeLevelsCount)}
                {expandedPanel === "college" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed School Levels (for 11th / 12th)</p>
                      {renderCheckboxGroup("college", "allowedSchoolLevels", ALL_SCHOOL_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom School Levels</p>
                      {renderCustomFields("college", "allowedSchoolLevels")}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed Program Levels</p>
                      {renderCheckboxGroup("college", "allowedProgramLevels", ALL_PROGRAM_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom Program Levels</p>
                      {renderCustomFields("college", "allowedProgramLevels")}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Max Class Number</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={ac.college?.maxClassNumber || 12}
                        onChange={(e) => handleAcademicNumber("college", "maxClassNumber", e.target.value)}
                        className={`${inputClassName} max-w-[160px]`}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        For Higher Secondary classes (e.g. 12 = up to Class 12)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* University Panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {renderPanelHeader("University", "🏛️", "university", uniLevelsCount)}
                {expandedPanel === "university" && (
                  <div className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Allowed Program Levels</p>
                      {renderCheckboxGroup("university", "allowedProgramLevels", ALL_PROGRAM_LEVELS)}
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Custom Program Levels</p>
                      {renderCustomFields("university", "allowedProgramLevels")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          ) : null}

          {/* Sidebar Customization */}
          {activeTab === "sidebar" ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Sidebar Customization</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add custom menu items to the sidebar with custom icons. These will appear in the sidebar for all users.
              </p>
            </div>

            <div className="space-y-4">
              {/* Add New Menu Item */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Add New Menu Item</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <input
                    type="text"
                    value={newMenuItem.label}
                    onChange={(e) => setNewMenuItem((current) => ({ ...current, label: e.target.value }))}
                    placeholder="Label (e.g., Reports)"
                    className={`${inputClassName}`}
                  />
                  <input
                    type="text"
                    value={newMenuItem.path}
                    onChange={(e) => setNewMenuItem((current) => ({ ...current, path: e.target.value }))}
                    placeholder="Path (e.g., /admin/reports)"
                    className={`${inputClassName}`}
                  />
                  <button
                    type="button"
                    onClick={() => openIconPicker(null)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      newMenuItem.icon
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {newMenuItem.icon ? (
                      <>
                        <newMenuItem.icon.component className="h-5 w-5" />
                        {newMenuItem.icon.name}
                      </>
                    ) : (
                      "Select Icon"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomMenuItem}
                    disabled={!newMenuItem.label || !newMenuItem.path || !newMenuItem.icon}
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Custom Menu Items List */}
              {formData.customSidebarItems && formData.customSidebarItems.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">Custom Menu Items</p>
                  <div className="space-y-2">
                    {formData.customSidebarItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <item.icon.component className="h-5 w-5 text-slate-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.path}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openIconPicker(index)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 transition-colors"
                          title="Change Icon"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMenuItem(index)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-100 transition-colors"
                          title="Remove"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: formData.primaryColor, borderRadius: getButtonRadius(formData.buttonStyle) }}
            className="mt-6 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Global UI Settings"}
          </button>
        </form>

        <div className={`rounded-[1.75rem] border p-6 shadow-card ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm uppercase tracking-[0.25em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Preview</p>
          <div className={`mt-5 overflow-hidden rounded-[1.5rem] border ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div
              className="p-6 text-white"
              style={{
                background: formData.loginBackgroundEnabled && (formData.loginBackgroundImageUrl || formData.loginBackground)
                  ? `linear-gradient(rgba(15,23,42,${formData.loginBackgroundOverlayEnabled ? (formData.loginBackgroundOverlayOpacity ?? 0.72) : 0}), rgba(15,23,42,${formData.loginBackgroundOverlayEnabled ? (formData.loginBackgroundOverlayOpacity ?? 0.72) : 0})), url(${formData.loginBackgroundImageUrl || formData.loginBackground}) center/cover`
                  : `linear-gradient(160deg, ${formData.sidebarColor} 0%, ${formData.primaryColor} 100%)`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">{formData.loginBrandEyebrow || formData.appName}</p>
              <h3 className="mt-4 text-3xl font-semibold">{formData.loginHeroTitle || "Live Login Theme Preview"}</h3>
              <p className="mt-3 text-sm text-white/80">{formData.loginHeroDescription || formData.footerText}</p>
            </div>
            <div className="space-y-4 p-6">
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Login background</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.loginBackgroundEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.loginBackgroundEnabled ? "Enabled" : "Default gradient"}
                </span>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Left panel image</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.loginPanelImageEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.loginPanelImageEnabled ? (formData.loginPanelImagePosition || "Enabled") : "Hidden"}
                </span>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Clean mode</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.loginCleanModeEnabled ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.loginCleanModeEnabled ? "Enabled" : "Standard"}
                </span>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Brand assets</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      formData.logo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {formData.logo ? "ERP icon ready" : "ERP icon pending"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      formData.favicon ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {formData.favicon ? "Favicon ready" : "Favicon pending"}
                  </span>
                </div>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Captcha on login</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.captchaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.captchaEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                <span>Secure admin recovery</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.privilegedRecoveryEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {formData.privilegedRecoveryEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: formData.primaryColor,
                  color: "#ffffff",
                  borderRadius: getButtonRadius(formData.buttonStyle),
                }}
                className="px-5 py-3 text-sm font-semibold"
              >
                {formData.loginButtonText || "Primary Button"}
              </button>
              <div className="flex gap-3">
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.primaryColor }} />
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.secondaryColor }} />
                <span className="h-10 w-10 rounded-full border border-slate-200" style={{ backgroundColor: formData.sidebarColor }} />
              </div>
            </div>
          </div>

          {/* Academic Config Preview */}
          <div className="mt-6 space-y-3">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Academic Config Preview</p>
            {[
              { label: "School", icon: "🏫", levels: ac.school?.allowedSchoolLevels || [], max: ac.school?.maxClassNumber },
              { label: "College", icon: "🎓", levels: [...(ac.college?.allowedSchoolLevels || []), ...(ac.college?.allowedProgramLevels || [])], max: ac.college?.maxClassNumber },
              { label: "University", icon: "🏛️", levels: ac.university?.allowedProgramLevels || [] },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.max && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Max Class {item.max}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.levels.length > 0 ? (
                    item.levels.map((l) => (
                      <span key={l} className="rounded-lg px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                        {l}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No levels enabled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {iconPickerOpen && (
        <IconPicker
          selectedIcon={editingIconIndex !== null ? formData.customSidebarItems?.[editingIconIndex]?.icon : newMenuItem.icon}
          onSelect={handleIconSelect}
          onClose={() => setIconPickerOpen(false)}
        />
      )}

      {cropperState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="lg:w-[380px]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {cropperState.kind === "favicon" ? "Favicon Crop" : "ERP Icon Crop"}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                  Fit the image exactly how you want
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Any image size is supported. Move and zoom the crop area, then apply the square output for crisp branding.
                </p>

                <div className="mt-6 space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="3.5"
                      step="0.05"
                      value={cropperState.zoom}
                      onChange={(event) =>
                        setCropperState((current) => ({ ...current, zoom: Number(event.target.value) }))
                      }
                      className="w-full accent-teal-600"
                    />
                    <p className="mt-2 text-xs text-slate-500">Zoom: {cropperState.zoom.toFixed(2)}x</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Horizontal Position</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={cropperState.positionX}
                      onChange={(event) =>
                        setCropperState((current) => ({ ...current, positionX: Number(event.target.value) }))
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Vertical Position</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={cropperState.positionY}
                      onChange={(event) =>
                        setCropperState((current) => ({ ...current, positionY: Number(event.target.value) }))
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                      <FiMove size={14} />
                      Position guide
                    </div>
                    <p className="mt-2 leading-5">
                      Best result ke liye subject ko square frame ke center me rakho. Favicon ke liye simple bold mark sabse clean dikhta hai.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Square Crop Preview</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{cropperState.fileName}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-900">
                      {cropperState.kind}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center">
                    <div className="mx-auto w-full max-w-[360px]">
                      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-200 shadow-inner dark:border-slate-700 dark:bg-slate-800">
                        <div className="absolute inset-0" style={cropPreviewStyle} />
                        <div className="pointer-events-none absolute inset-0 border-[10px] border-white/35" />
                        <div className="pointer-events-none absolute inset-6 rounded-[1.35rem] border border-dashed border-white/80" />
                      </div>
                    </div>

                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Large Preview</p>
                        <div className="mt-3 h-28 w-28 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          <div className="h-full w-full" style={cropPreviewStyle} />
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Favicon Size</p>
                        <div className="mt-3 flex h-28 w-28 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-slate-300 dark:ring-slate-600">
                            <div className="h-full w-full" style={cropPreviewStyle} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCropper}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyCroppedImage}
                    className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GlobalUISettings;
