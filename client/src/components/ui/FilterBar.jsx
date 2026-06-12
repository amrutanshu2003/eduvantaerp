import { useUISettings } from "../../context/UISettingsContext";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

const FilterBar = ({ 
  filters = {}, 
  onFilterChange, 
  onSearch, 
  onReset, 
  searchPlaceholder = "Search...",
  children 
}) => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  const handleInputChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
      <div className="grid gap-4 md:grid-cols-4">
        {children}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Showing results
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            type="submit"
            onClick={onSearch}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="flex-1 sm:flex-none"
          >
            Search
          </Button>
          <Button
            variant="secondary"
            onClick={onReset}
            className="flex-1 sm:flex-none"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
