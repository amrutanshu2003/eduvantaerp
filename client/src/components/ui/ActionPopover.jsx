import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiEye, FiLock, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useUISettings } from "../../context/UISettingsContext";

const ActionPopover = ({ 
  onEdit, 
  onView, 
  onResetPassword, 
  onActivate, 
  onDeactivate, 
  onDelete,
  item,
  isActive = true 
}) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const actions = [];

  if (onView) {
    actions.push({ label: "View", icon: FiEye, onClick: onView, variant: "default" });
  }
  if (onEdit) {
    actions.push({ label: "Edit", icon: FiEdit, onClick: onEdit, variant: "default" });
  }
  if (onResetPassword) {
    actions.push({ label: "Reset Password", icon: FiLock, onClick: onResetPassword, variant: "default" });
  }
  if (isActive && onDeactivate) {
    actions.push({ label: "Deactivate", icon: FiLock, onClick: onDeactivate, variant: "warning" });
  }
  if (!isActive && onActivate) {
    actions.push({ label: "Activate", icon: FiLock, onClick: onActivate, variant: "success" });
  }
  if (onDelete) {
    actions.push({ label: "Delete", icon: FiTrash2, onClick: onDelete, variant: "danger" });
  }

  if (actions.length === 0) return null;

  const isNoop = (fn) => {
    if (!fn) return true;
    const str = fn.toString().replace(/\s+/g, "");
    return (
      /^(?:(?:\(\w*\)|[^=]+)=>\s*\{\s*\}|function\s*\w*\([^\)]*\)\s*\{\s*\})$/.test(str) ||
      str === "()=>{}" ||
      str === "function(){}" ||
      str === "item=>{}" ||
      str === "(item)=>{}"
    );
  };

  const handleActionClick = (action) => {
    if (isNoop(action.onClick)) {
      const pathname = window.location.pathname.replace(/\/$/, "");
      if (action.label === "View") {
        navigate(`${pathname}/${item._id}`);
      } else if (action.label === "Edit") {
        navigate(`${pathname}/${item._id}/edit`);
      }
    } else {
      action.onClick(item);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          isDark 
            ? "hover:bg-slate-700 text-slate-400 hover:text-white" 
            : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        }`}
        aria-label="Actions"
      >
        <FiMoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute right-0 z-50 w-48 rounded-xl border shadow-lg py-1 ${
            isDark 
              ? "bg-slate-800 border-slate-700" 
              : "bg-white border-slate-200"
          }`}
          style={{ top: "calc(100% + 4px)" }}
        >
          {actions.map((action) => {
            const ActionIcon = action.icon;
            const colorClass = {
              default: isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100",
              warning: isDark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50",
              success: isDark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50",
              danger: isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50",
            }[action.variant];

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleActionClick(action)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${colorClass}`}
              >
                <ActionIcon className="h-4 w-4 flex-shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionPopover;
