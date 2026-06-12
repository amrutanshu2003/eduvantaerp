import { useUISettings } from "../context/UISettingsContext";

const PageHeader = ({ eyebrow, title, description, actions = null }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-card md:flex md:items-end md:justify-between md:gap-6 md:p-8 ${
        isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-200/80 bg-white/95"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.14),transparent_56%)]"
            : "bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_32%),linear-gradient(135deg,rgba(226,232,240,0.35),transparent_56%)]"
        }`}
      />
      <div className="relative">
        {eyebrow ? <p className={`text-xs font-semibold uppercase tracking-[0.34em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{eyebrow}</p> : null}
        <h1 className={`mt-3 text-3xl font-semibold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h1>
        {description ? <p className={`mt-4 max-w-3xl text-sm leading-7 sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>{description}</p> : null}
      </div>
      {actions ? <div className="relative mt-4 md:mt-0">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
