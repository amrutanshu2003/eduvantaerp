import { useUISettings } from "../../context/UISettingsContext";
import Button from "./Button";
import { useEffect } from "react";

const ConfirmModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false 
}) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div 
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? "bg-slate-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
        <p className={`mt-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {message}
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
