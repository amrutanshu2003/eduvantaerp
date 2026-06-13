import { useMemo } from "react";
import { useUISettings } from "../context/UISettingsContext";
import { defaultBrandIcon, getBrandInitials, hasCustomBrandLogo, resolveBrandLogo } from "../utils/branding";

export const useBranding = () => {
  const { settings } = useUISettings();

  return useMemo(() => {
    const appName = settings?.appName?.trim() || "Eduvanta ERP";
    const logo = settings?.logo?.trim() || "";
    const favicon = settings?.favicon?.trim() || "";

    return {
      appName,
      logo,
      favicon,
      initials: getBrandInitials(appName),
      hasCustomLogo: hasCustomBrandLogo(logo),
      brandLogo: resolveBrandLogo(logo),
      defaultBrandIcon,
    };
  }, [settings]);
};

export default useBranding;
