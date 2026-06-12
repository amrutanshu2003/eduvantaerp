import { useUISettings } from "../../context/UISettingsContext";
import { forwardRef } from "react";

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = "", 
  ...props 
}, ref) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  const baseStyles = "w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200";
  const themeStyles = isDark 
    ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
  const errorStyles = error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseStyles} ${themeStyles} ${errorStyles} border ${className}`}
        {...props}
      />
      {helperText && !error && (
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
