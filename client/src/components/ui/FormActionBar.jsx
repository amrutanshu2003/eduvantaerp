import { useUISettings } from "../../context/UISettingsContext";
import Button from "./Button";

const FormActionBar = ({ onCancel, onSubmit, submitting, submitLabel = "Save", cancelLabel = "Cancel", isDark }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-6 dark:border-slate-800">
      {onCancel && (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={submitting}
        style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
      >
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
};

export default FormActionBar;
