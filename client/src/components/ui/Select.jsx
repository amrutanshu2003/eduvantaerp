import { useUISettings } from "../../context/UISettingsContext";
import { forwardRef } from "react";

const Select = forwardRef(({ 
  label, 
  error, 
  helperText, 
  children, 
  className = "", 
  ...props 
}, ref) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  const baseStyles = "w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 appearance-none cursor-pointer";
  const themeStyles = isDark 
    ? "bg-slate-700/50 border-slate-600 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    : "bg-white border-slate-200 text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
  const errorStyles = error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`${baseStyles} ${themeStyles} ${errorStyles} border ${className} pr-10`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helperText && !error && (
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";

export default Select;
