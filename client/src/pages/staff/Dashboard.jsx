import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, isHostelSecurityUser } from "../../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../../utils/transportAccess";

const Dashboard = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/staff");
        setStats(data.stats);
        setLatestNotices(data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load staff dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <LoadingBlock message="Loading staff dashboard..." />;
  
  const visibleStats = stats
    ? Object.entries(stats).filter(
        ([key]) =>
          key !== "totalStaff" ||
          !(
            user?.designation === "librarian" ||
            (user?.permissions || []).includes("library.manage") ||
            canManageTransport(user) ||
            isDriverUser(user) ||
            canManageHostel(user) ||
            isHostelSecurityUser(user)
          )
      )
    : [];

  const cardColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];

  const cardRoutes = [
    "/staff/attendance",
    "/staff/library",
    "/staff/transport",
    "/staff/hostel",
    "/staff/notices",
    "/staff/fees",
    "/staff/exams",
    "/staff/assignments",
  ];

  const cards = visibleStats.map(([key, value]) => ({
    label: formatLabel(key),
    value,
  }));

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <Link
            key={card.label}
            to={cardRoutes[index] || "#"}
            className={`${cardColors[index % cardColors.length]} rounded-[1.75rem] p-6 shadow-card transition hover:opacity-90 hover:scale-105`}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">{card.label}</p>
            <h3 className="mt-4 text-4xl font-semibold text-white">{card.value}</h3>
          </Link>
        ))}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Staff Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage your staff responsibilities with {settings.appName}. Access library, transport, hostel, and other modules based on your designation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/staff/attendance" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">View Attendance</Link>
          <Link to="/staff/library" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Library</Link>
          <Link to="/staff/transport" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Transport</Link>
          <Link to="/staff/hostel" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Hostel</Link>
          <Link to="/staff/notices" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Notices</Link>
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for staff members." />
    </section>
  );
};

export default Dashboard;
