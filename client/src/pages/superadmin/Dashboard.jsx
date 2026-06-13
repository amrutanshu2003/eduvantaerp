import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";
import { FiHome, FiCheckSquare, FiBookOpen, FiLayers, FiUsers, FiClock, FiArrowRight } from "react-icons/fi";

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

  if (loading) {
    return <LoadingBlock message="Loading dashboard stats..." />;
  }

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <PageHeader
        eyebrow="Super Admin"
        title="Dashboard Overview"
        description={`Manage all institutes and global settings for ${settings.appName}. Track institute statistics, manage admins, and configure system-wide settings.`}
        actions={
          <Link
            to="/super-admin/institutes/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-lg active:scale-95"
          >
            <FiHome className="h-4 w-4" />
            New Institute
          </Link>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {stats.map((item, index) => {
          const Icon = getIcon(item.label);
          return (
            <StatCard
              key={item.label}
              to={CARD_ROUTES[index]}
              color={CARD_COLORS[index % CARD_COLORS.length]}
              label={item.label}
              value={item.value}
              icon={Icon}
              detail={item.detail}
            />
          );
        })}
      </div>

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Common tasks for super admin</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/super-admin/institutes"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FiHome className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Manage Institutes</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            to="/super-admin/admins"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiUsers className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Manage Admins</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            to="/super-admin/ui-settings"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FiLayers className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Global UI Settings</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            to="/super-admin/audit-log-settings"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <FiClock className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Audit Log Settings</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            to="/super-admin/recycle-bin"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <FiCheckSquare className="h-5 w-5" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Recycle Bin</span>
            </div>
            <FiArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </SectionCard>
    </section>
  );
};

export default Dashboard;
