import { FiInbox } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useUISettings } from "../context/UISettingsContext";

const EmptyState = ({ title, description, actionText, actionLink, onActionClick, icon: Icon = FiInbox }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-5">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-semibold text-ink dark:text-slate-200">{title}</h3>
      <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      
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
