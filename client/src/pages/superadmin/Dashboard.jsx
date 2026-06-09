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
    return <LoadingBlock message="Loading super admin analytics..." />;
  }

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[1.75rem] bg-white p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
            <h3 className="mt-4 text-4xl font-semibold text-ink">{item.value}</h3>
            <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
          </div>
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
