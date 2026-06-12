import { useUISettings } from "../../context/UISettingsContext";

const TableShell = ({ 
  headers = [], 
  children, 
  empty = false,
  emptyMessage = "No data available",
  className = "" 
}) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";

  if (empty) {
    return (
      <div className={`rounded-[1.75rem] shadow-card overflow-hidden ${isDark ? "bg-slate-800" : "bg-white"} ${className}`}>
        <div className="p-12 text-center">
          <p className={`text-lg font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[1.75rem] shadow-card ${isDark ? "bg-slate-800" : "bg-white"} ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className={`${isDark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-4 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableShell;
