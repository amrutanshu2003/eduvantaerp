import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { FiHome, FiCheckSquare, FiBookOpen, FiLayers, FiUsers, FiClock } from "react-icons/fi";

const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
    <div className="skeleton-block h-3 w-24 rounded-full" />
    <div className="skeleton-block mt-5 h-9 w-16 rounded-xl" />
    <div className="skeleton-block mt-3 h-3 w-40 rounded-full" />
  </div>
);

const CARD_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500",
];

const CARD_ROUTES = [
  "/super-admin/institutes", "/super-admin/institutes", "/super-admin/institutes",
  "/super-admin/institutes", "/super-admin/institutes", "/super-admin/admins",
  "/super-admin/institutes",
];

const STATIC_LABELS = [
  "Total Institutes", "Active Institutes", "School Count",
  "College Count", "University Count", "Total Admins", "Trial / Expired",
];

const getIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes("total institutes")) return FiHome;
  if (l.includes("active")) return FiCheckSquare;
  if (l.includes("school")) return FiBookOpen;
  if (l.includes("college")) return FiLayers;
  if (l.includes("university")) return FiBookOpen;
  if (l.includes("admin")) return FiUsers;
  if (l.includes("trial") || l.includes("expired")) return FiClock;
  return FiHome;
};

const Dashboard = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/institutes");
        setStats([
          { label: "Total Institutes", value: data.stats.totalInstitutes, detail: "All non-deleted institute records" },
          { label: "Active Institutes", value: data.stats.activeInstitutes, detail: "Institutes currently active" },
          { label: "School Count", value: data.stats.schoolCount, detail: "School-type institutes" },
          { label: "College Count", value: data.stats.collegeCount, detail: "College-type institutes" },
          { label: "University Count", value: data.stats.universityCount, detail: "University-type institutes" },
          { label: "Total Admins", value: data.stats.totalAdmins, detail: "Institute admin accounts created" },
          { label: "Trial / Expired", value: data.stats.trialExpiredInstitutes, detail: "Institutes needing subscription follow-up" },
        ]);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? STATIC_LABELS.map((label, i) => (
              <StatCardSkeleton key={label} />
            ))
          : stats.map((item, index) => {
              const Icon = getIcon(item.label);
              return (
                <Link
                  key={item.label}
                  to={CARD_ROUTES[index]}
                  className={`${CARD_COLORS[index % CARD_COLORS.length]} rounded-[1.75rem] p-6 shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden`}
                >
                  <div className="absolute right-5 top-5 text-white/25 text-3xl">
                    <Icon />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/90">{item.label}</p>
                  <h3 className="mt-4 text-4xl font-bold tracking-tight text-white">{item.value}</h3>
                  <p className="mt-3 text-sm font-medium text-white/90">{item.detail}</p>
                </Link>
              );
            })}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Super Admin Overview</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/super-admin/institutes"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Manage Institutes
          </Link>
          <Link to="/super-admin/admins" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Manage Admins
          </Link>
          <Link to="/super-admin/ui-settings" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Update Global UI
          </Link>
          <Link to="/super-admin/audit-log-settings" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Audit Logs
          </Link>
          <Link to="/super-admin/recycle-bin" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Recycle Bin
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
