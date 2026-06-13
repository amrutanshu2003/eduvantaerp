export const defaultBrandIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230f766e'/%3E%3Cstop offset='100%25' stop-color='%2314b8a6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='18' fill='url(%23g)'/%3E%3Cpath d='M19 20h17c7.2 0 12 4.4 12 11.1 0 4.8-2.4 8.3-6.6 10.1L48 51H38.4l-5.3-8.3h-5V51H19V20zm9.1 7.4v8h7c2.9 0 4.5-1.5 4.5-4s-1.6-4-4.5-4h-7z' fill='white'/%3E%3C/svg%3E";

export const getBrandInitials = (appName = "Eduvanta ERP") =>
  (appName || "Eduvanta ERP")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "EE";

export const resolveBrandLogo = (logo) => {
  const normalizedLogo = typeof logo === "string" ? logo.trim() : "";
  return normalizedLogo || defaultBrandIcon;
};

export const hasCustomBrandLogo = (logo) => Boolean(typeof logo === "string" && logo.trim());
