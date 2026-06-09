import { useEffect, useState } from "react";
import { useUISettings } from "../context/UISettingsContext";

const CustomAlert = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [alertState, setAlertState] = useState({
    show: false,
    message: "",
    animateIn: false,
  });

  useEffect(() => {
    // Override window.alert
    const originalAlert = window.alert;

    window.alert = (message) => {
      setAlertState({
        show: true,
        message: String(message),
        animateIn: true,
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const handleClose = () => {
    setAlertState((curr) => ({ ...curr, animateIn: false }));
    // Wait for fadeout animation before destroying component state
    setTimeout(() => {
      setAlertState((curr) => ({ ...curr, show: false }));
    }, 200);
  };

  if (!alertState.show) return null;

  const isError = /fail|error|unable|invalid|missing|denied|wrong|failed/i.test(alertState.message);
  
  const buttonStyle = {
    backgroundColor: isError ? "#ef4444" : (settings.primaryColor || "#0f766e"),
    borderRadius: getButtonRadius ? getButtonRadius(settings.buttonStyle) : "1rem",
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        alertState.animateIn ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-sm transform rounded-[2rem] bg-white p-6 shadow-2xl transition-all duration-300 ${
          alertState.animateIn ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated Dynamic Icon */}
          {isError ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4 animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4 animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}

          <h3 className="text-xl font-bold text-slate-800">
            {isError ? "Attention" : "Success"}
          </h3>
          
          <p className="mt-3 text-sm leading-6 text-slate-500 whitespace-pre-wrap">
            {alertState.message}
          </p>

          <button
            onClick={handleClose}
            style={buttonStyle}
            className="mt-6 w-full py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
