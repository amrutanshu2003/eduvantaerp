import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";

const Dashboard = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/student");
        setStats(data.stats);
        setLatestNotices(data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load student dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading student dashboard..." />;

  const cardColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-lime-500",
    "bg-violet-500",
  ];

  const cardRoutes = [
    "/student/attendance",
    "/student/exams",
    "/student/fees",
    "/student/assignments",
    "/student/marks",
    "/student/results",
    "/student/notices",
    "/student/timetable",
    "/student/library",
    "/student/transport",
    "/student/hostel",
    "/student/profile",
  ];

  const cards = stats ? Object.entries(stats).map(([key, value]) => ({
    label: formatLabel(key),
    value,
  })) : [];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
        <h2 className="text-2xl font-semibold text-ink">Student Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Welcome to {settings.appName}. Track your attendance, view exam results, check fees, assignments, and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/student/attendance" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">View Attendance</Link>
          <Link to="/student/exams" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Exams</Link>
          <Link to="/student/assignments" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Assignments</Link>
          <Link to="/student/marks" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Marks</Link>
          <Link to="/student/fees" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Fee Status</Link>
          <Link to="/student/notices" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Notices</Link>
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for you and your academic group." />
    </section>
  );
};

export default Dashboard;
