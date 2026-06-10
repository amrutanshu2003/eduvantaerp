import { useEffect, useState } from "react";
import { useUISettings } from "../context/UISettingsContext";

const CustomAlert = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [alertState, setAlertState] = useState({
    show: false,
    message: "",
    animateIn: false,
  });

  const [confirmState, setConfirmState] = useState({
    show: false,
    message: "",
    animateIn: false,
    resolve: null,
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

    // Override window.confirm
    const originalConfirm = window.confirm;
    window.confirm = (message) => {
      return new Promise((resolve) => {
        setConfirmState({
          show: true,
          message: String(message),
          animateIn: true,
          resolve,
        });
      });
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  const handleAlertClose = () => {
    setAlertState((curr) => ({ ...curr, animateIn: false }));
    setTimeout(() => {
      setAlertState((curr) => ({ ...curr, show: false }));
    }, 200);
  };

  const handleConfirmAction = (value) => {
    setConfirmState((curr) => ({ ...curr, animateIn: false }));
    setTimeout(() => {
      setConfirmState((curr) => ({ ...curr, show: false }));
      if (confirmState.resolve) {
        confirmState.resolve(value);
      }
    }, 200);
  };

  const isAlertError = /fail|error|unable|invalid|missing|denied|wrong|failed/i.test(alertState.message);

  const radius = getButtonRadius ? getButtonRadius(settings.buttonStyle) : "1rem";
  
  const alertButtonStyle = {
    backgroundColor: isAlertError ? "#ef4444" : (settings.primaryColor || "#0f766e"),
    borderRadius: radius,
  };

  const confirmOkButtonStyle = {
    backgroundColor: settings.primaryColor || "#0f766e",
    borderRadius: radius,
  };

  const confirmCancelButtonStyle = {
    background: "var(--theme-surface-subtle)",
    border: "1px solid var(--theme-border)",
    color: "var(--theme-text-soft)",
    borderRadius: radius,
  };

  const modalStyle = {
    background: "var(--theme-surface)",
    border: "1px solid var(--theme-border)",
    boxShadow: "var(--theme-shadow)",
    borderRadius: "2rem",
  };

  const backdropStyle = {
    background: "var(--theme-overlay)",
  };

  const textPrimaryStyle = {
    color: "var(--theme-text)",
  };

  const textSecondaryStyle = {
    color: "var(--theme-text-soft)",
  };

  return (
    <>
      {/* Alert Modal */}
      {alertState.show && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
            alertState.animateIn ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Glassmorphism Backdrop */}
          <div
            style={backdropStyle}
            className="fixed inset-0 backdrop-blur-md transition-opacity duration-300"
            onClick={handleAlertClose}
          />

          {/* Glassmorphism Modal container */}
          <div
            style={modalStyle}
            className={`relative w-full max-w-sm transform backdrop-blur-xl p-8 transition-all duration-300 ${
              alertState.animateIn ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Animated Dynamic Icon */}
              {isAlertError ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-bounce">
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4 animate-bounce">
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

              <h3 style={textPrimaryStyle} className="text-xl font-bold">
                {isAlertError ? "Attention" : "Success"}
              </h3>
              
              <p style={textSecondaryStyle} className="mt-3 text-sm leading-6 whitespace-pre-wrap font-semibold">
                {alertState.message}
              </p>

              <button
                onClick={handleAlertClose}
                style={alertButtonStyle}
                className="mt-6 w-full py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState.show && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
            confirmState.animateIn ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Glassmorphism Backdrop */}
          <div
            style={backdropStyle}
            className="fixed inset-0 backdrop-blur-md transition-opacity duration-300"
            onClick={() => handleConfirmAction(false)}
          />

          {/* Glassmorphism Modal container */}
          <div
            style={modalStyle}
            className={`relative w-full max-w-sm transform backdrop-blur-xl p-8 transition-all duration-300 ${
              confirmState.animateIn ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Question Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 mb-4 animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                  stroke="currentColor"
                  className="h-8 w-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>

              <h3 style={textPrimaryStyle} className="text-xl font-bold">
                Confirm Action
              </h3>
              
              <p style={textSecondaryStyle} className="mt-3 text-sm leading-6 whitespace-pre-wrap font-semibold">
                {confirmState.message}
              </p>

              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => handleConfirmAction(false)}
                  style={confirmCancelButtonStyle}
                  className="flex-1 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  style={confirmOkButtonStyle}
                  className="flex-1 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomAlert;
