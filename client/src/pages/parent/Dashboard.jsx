import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";

const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
    <div className="skeleton-block h-3 w-24 rounded-full" />
    <div className="skeleton-block mt-5 h-9 w-16 rounded-xl" />
  </div>
);

const CARD_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-lime-500", "bg-violet-500",
];

const CARD_ROUTES = [
  "/parent/attendance", "/parent/exams", "/parent/fees",
  "/parent/assignments", "/parent/marks", "/parent/results",
  "/parent/notices", "/parent/timetable", "/parent/library",
  "/parent/transport", "/parent/hostel", "/parent/profile",
];

const SKELETON_COUNT = 11;

const Dashboard = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/parent");
        setStats(data.stats);
        setLatestNotices(data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load parent dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = stats
    ? Object.entries(stats).map(([key, value]) => ({ label: formatLabel(key), value }))
    : [];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : cards.map((card, index) => (
              <Link
                key={card.label}
                to={CARD_ROUTES[index] || "#"}
                className={`${CARD_COLORS[index % CARD_COLORS.length]} rounded-[1.75rem] p-6 shadow-card transition hover:opacity-90 hover:scale-105`}
              >
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">{card.label}</p>
                <h3 className="mt-4 text-4xl font-semibold text-white">{card.value}</h3>
              </Link>
            ))}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Parent Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Monitor your children's progress with {settings.appName}. Track attendance, view exam results, fee status, and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/parent/attendance" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">View Attendance</Link>
          <Link to="/parent/exams" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Exams</Link>
          <Link to="/parent/assignments" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Assignments</Link>
          <Link to="/parent/fees" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Fee Status</Link>
          <Link to="/parent/notices" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Notices</Link>
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for parents and linked children." />
    </section>
  );
};

export default Dashboard;
