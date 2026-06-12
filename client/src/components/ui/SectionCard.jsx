import { useUISettings } from "../../context/UISettingsContext";

const SectionCard = ({ 
  children, 
  className = "", 
  padding = "p-6",
  noPadding = false 
}) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`rounded-[1.75rem] shadow-card ${isDark ? "bg-slate-800" : "bg-white"} ${noPadding ? "" : padding} ${className}`}>
      {children}
    </div>
  );
};

export default SectionCard;
