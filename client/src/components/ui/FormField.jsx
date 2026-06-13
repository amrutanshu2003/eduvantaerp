import { useUISettings } from "../../context/UISettingsContext";

const FormField = ({ label, required = false, error, helperText, children, className = "" }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={className}>
      {label && (
        <label className={`mb-2 block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div>{children}</div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {helperText && !error && <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{helperText}</p>}
    </div>
  );
};

export default FormField;
