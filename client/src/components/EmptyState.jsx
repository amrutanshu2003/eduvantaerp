import { FiInbox } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useUISettings } from "../context/UISettingsContext";

const EmptyState = ({ title, description, actionText, actionLink, onActionClick, icon: Icon = FiInbox }) => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`rounded-[1.75rem] border border-dashed p-10 text-center shadow-card transition-all duration-300 hover:border-opacity-80 ${isDark ? "border-slate-700 bg-slate-800 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-5 ${isDark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-400"}`}>
        <Icon size={28} />
      </div>
      <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
      <p className={`mt-3 text-sm max-w-sm mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
      
      {actionText && (actionLink || onActionClick) && (
        <div className="mt-6">
          {actionLink ? (
            <Link
              to={actionLink}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-lg active:scale-95"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              type="button"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-lg active:scale-95"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
