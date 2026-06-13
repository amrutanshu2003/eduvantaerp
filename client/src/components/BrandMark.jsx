import { defaultBrandIcon, getBrandInitials, hasCustomBrandLogo, resolveBrandLogo } from "../utils/branding";

const sizeClassMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-11 w-11",
  xl: "h-12 w-12",
};

const BrandMark = ({
  appName = "Eduvanta ERP",
  logo = "",
  size = "md",
  className = "",
  imageClassName = "",
  alt,
}) => {
  const resolvedSize = sizeClassMap[size] || sizeClassMap.md;
  const customLogo = hasCustomBrandLogo(logo);
  const resolvedLogo = resolveBrandLogo(logo);
  const initials = getBrandInitials(appName);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/10 ${resolvedSize} ${className}`.trim()}
      style={!customLogo ? { background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" } : undefined}
      aria-hidden={customLogo ? undefined : true}
    >
      {customLogo ? (
        <img
          src={resolvedLogo}
          alt={alt || `${appName} logo`}
          className={`h-full w-full max-h-full max-w-full object-contain ${imageClassName}`.trim()}
        />
      ) : resolvedLogo === defaultBrandIcon ? (
        <img
          src={defaultBrandIcon}
          alt={alt || `${appName} default logo`}
          className={`h-full w-full max-h-full max-w-full object-contain p-1.5 ${imageClassName}`.trim()}
        />
      ) : (
        <span className="text-sm font-bold tracking-[0.14em] text-white">{initials}</span>
      )}
    </div>
  );
};

export default BrandMark;
