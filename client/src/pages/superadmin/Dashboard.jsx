import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";

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

  const cardColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
  ];

  const cardRoutes = [
    "/super-admin/institutes",
    "/super-admin/institutes",
    "/super-admin/institutes",
    "/super-admin/institutes",
    "/super-admin/institutes",
    "/super-admin/admins",
    "/super-admin/institutes",
  ];

  if (loading) {
    return <LoadingBlock message="Loading super admin analytics..." />;
  }

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item, index) => (
          <Link
            key={item.label}
            to={cardRoutes[index]}
            className={`${cardColors[index]} rounded-[1.75rem] p-6 shadow-card transition hover:opacity-90 hover:scale-105`}
          >
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">{item.label}</p>
            <h3 className="mt-4 text-4xl font-semibold text-white">{item.value}</h3>
            <p className="mt-3 text-sm text-white/70">{item.detail}</p>
          </Link>
        ))}
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
          <Link to="/super-admin/ui-settings" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Update Global UI
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
