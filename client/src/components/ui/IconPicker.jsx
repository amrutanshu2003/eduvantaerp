import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { ICON_OPTIONS } from "../../utils/iconRegistry";
import { useUISettings } from "../../context/UISettingsContext";

const IconPicker = ({ selectedIcon, onSelect, onClose }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";
  const selectedKey = selectedIcon?.key || selectedIcon?.iconKey || null;

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-3xl rounded-[1.75rem] border p-6 shadow-2xl ${
          isDark ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Choose Sidebar Icon</h3>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Pick an icon for the custom sidebar item.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-2 transition ${
              isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-label="Close icon picker"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ICON_OPTIONS.map((option) => {
            const Icon = option.component;
            const isSelected = selectedKey === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : isDark
                      ? "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isSelected
                      ? "bg-indigo-100 text-indigo-700"
                      : isDark
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
