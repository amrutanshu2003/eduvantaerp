import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const SubmissionForm = ({ title, description, formData, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Answer</label>
            <textarea name="answerText" value={formData.answerText} onChange={onChange} className={`${inputClass} min-h-40`} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Attachment</label>
            <input name="attachment" value={formData.attachment} onChange={onChange} className={inputClass} placeholder="Optional URL or filename" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Submitting..." : "Submit Assignment"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SubmissionForm;
