import { useEffect, useRef, useState } from "react";
import { FiBell, FiLogOut, FiSearch, FiSun, FiMoon } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";
import api from "../api/axios";

const Navbar = ({ onThemeToggle, themeReveal }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, getButtonRadius, resolvedTheme, toggleTheme } = useUISettings();
  const themeToggleRef = useRef(null);
  const [institutes, setInstitutes] = useState([]);
  const [activeInstId, setActiveInstId] = useState(
    localStorage.getItem("activeInstituteId") || ""
  );

  useEffect(() => {
    if (user?.role !== "superadmin") return;

    const fetchInstitutes = async () => {
      try {
        const { data } = await api.get("/institutes");
        const activeList = data.institutes.filter((inst) => inst.status === "active");
        setInstitutes(activeList);
        
        // If nothing is selected, default to the first active institute
        if (!localStorage.getItem("activeInstituteId") && activeList.length > 0) {
          localStorage.setItem("activeInstituteId", activeList[0]._id);
          setActiveInstId(activeList[0]._id);
        }
      } catch (error) {
        console.error("Unable to load institutes in navbar", error);
      }
    };

    fetchInstitutes();
  }, [user]);

  const handleInstituteChange = (event) => {
    const nextId = event.target.value;
    localStorage.setItem("activeInstituteId", nextId);
    setActiveInstId(nextId);
    window.location.reload(); // Reload to refresh all active panels/states with new scope
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isDark = resolvedTheme === "dark";
  const handleThemeToggleClick = () => {
    if (onThemeToggle) {
      onThemeToggle(themeToggleRef.current);
      return;
    }

    toggleTheme();
  };

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em]" style={{ color: settings.primaryColor }}>
          {settings.appName}
        </p>
        <h1 className="text-2xl font-semibold text-ink">Welcome back, {user?.name}</h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {user?.role === "superadmin" && institutes.length > 0 && (
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Managing:</span>
            <select
              value={activeInstId}
              onChange={handleInstituteChange}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none border-none cursor-pointer"
            >
              {institutes.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500">
          <FiSearch />
          <input
            type="text"
            placeholder="Search modules..."
            className="w-full bg-transparent text-sm outline-none md:w-56"
          />
        </label>

        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <FiBell />
          Notifications
        </button>

        <button
          ref={themeToggleRef}
          type="button"
          onClick={handleThemeToggleClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-90"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span
            className="flex items-center justify-center"
            style={
              themeReveal
                ? {
                    animation: `${themeReveal.direction === "expand" ? "login-theme-icon-bloom" : "login-theme-icon-dock"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                  }
                : undefined
            }
          >
            {isDark ? (
              <FiSun className="h-4 w-4 text-amber-500" />
            ) : (
              <FiMoon className="h-4 w-4 text-slate-600" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
