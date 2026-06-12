import { useUISettings } from "../../context/UISettingsContext";
import { forwardRef } from "react";

const Button = forwardRef(({ 
  variant = "primary", 
  size = "md", 
  children, 
  className = "", 
  disabled = false,
  type = "button",
  ...props 
}, ref) => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary: `text-white hover:opacity-90 focus:ring-offset-2`,
    secondary: `${isDark ? "text-slate-200 border-slate-600 hover:bg-slate-700" : "text-slate-700 border-slate-300 hover:bg-slate-50"} border`,
    ghost: `${isDark ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`,
    danger: "text-white hover:opacity-90 focus:ring-offset-2",
    warning: "text-white hover:opacity-90 focus:ring-offset-2",
  };

  const backgroundColorStyles = {
    primary: { backgroundColor: settings.primaryColor },
    secondary: {},
    ghost: {},
    danger: { backgroundColor: "#f43f5e" },
    warning: { backgroundColor: "#f59e0b" },
  };

  const focusRingStyles = {
    primary: { focusRingColor: settings.primaryColor },
    secondary: { focusRingColor: isDark ? "#64748b" : "#94a3b8" },
    ghost: { focusRingColor: isDark ? "#64748b" : "#94a3b8" },
    danger: { focusRingColor: "#f43f5e" },
    warning: { focusRingColor: "#f59e0b" },
  };

  const borderRadius = getButtonRadius(settings.buttonStyle);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={{
        ...backgroundColorStyles[variant],
        borderRadius,
        ...(variant !== "secondary" && variant !== "ghost" ? {} : {}),
      }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
