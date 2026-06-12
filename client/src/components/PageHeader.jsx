import { useUISettings } from "../context/UISettingsContext";

const PageHeader = ({ eyebrow, title, description, actions = null }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`flex flex-col gap-4 rounded-[1.75rem] p-6 shadow-card md:flex-row md:items-end md:justify-between ${isDark ? "bg-slate-800" : "bg-white"}`}>
      <div>
        {eyebrow ? <p className={`text-sm uppercase tracking-[0.3em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{eyebrow}</p> : null}
        <h1 className={`mt-2 text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h1>
        {description ? <p className={`mt-3 max-w-3xl text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
};

export default PageHeader;
