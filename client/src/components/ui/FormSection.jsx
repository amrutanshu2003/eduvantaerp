import { useUISettings } from "../../context/UISettingsContext";

const FormSection = ({ title, description, children, className = "" }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`rounded-[1.75rem] border p-6 shadow-card ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>}
          {description && <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default FormSection;
