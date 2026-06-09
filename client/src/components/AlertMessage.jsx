const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-600",
  info: "border-slate-200 bg-slate-50 text-slate-600",
};

const AlertMessage = ({ tone = "info", message }) => {
  if (!message) {
    return null;
  }

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone] || toneClasses.info}`}>{message}</div>;
};

export default AlertMessage;
