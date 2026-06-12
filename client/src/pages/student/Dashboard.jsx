import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";
import {
  FiUsers,
  FiUser,
  FiShield,
  FiLayers,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiEdit,
  FiFileText,
  FiCreditCard,
  FiClock,
  FiTruck,
  FiHome,
  FiInfo,
} from "react-icons/fi";

const CARD_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-lime-500", "bg-violet-500",
];

const CARD_ROUTES = [
  "/student/attendance", "/student/exams", "/student/fees",
  "/student/assignments", "/student/marks", "/student/results",
  "/student/notices", "/student/timetable", "/student/library",
  "/student/transport", "/student/hostel", "/student/profile",
];

const getStatIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes("student")) return FiUsers;
  if (l.includes("teacher") || l.includes("faculty")) return FiUser;
  if (l.includes("parent") || l.includes("guardian")) return FiShield;
  if (l.includes("staff")) return FiLayers;
  if (l.includes("academic") || l.includes("subject") || l.includes("course") || l.includes("department")) return FiBookOpen;
  if (l.includes("attendance")) return FiCheckSquare;
  if (l.includes("exam")) return FiCalendar;
  if (l.includes("mark")) return FiEdit;
  if (l.includes("result") || l.includes("grade")) return FiFileText;
  if (l.includes("notice")) return FiFileText;
  if (l.includes("fee")) return FiCreditCard;
  if (l.includes("timetable") || l.includes("period")) return FiClock;
  if (l.includes("assignment") || l.includes("submission")) return FiEdit;
  if (l.includes("book") || l.includes("library")) return FiBookOpen;
  if (l.includes("vehicle") || l.includes("transport") || l.includes("route") || l.includes("stop")) return FiTruck;
  if (l.includes("hostel") || l.includes("room") || l.includes("bed") || l.includes("outpass") || l.includes("complaint")) return FiHome;
  return FiInfo;
};

const SKELETON_COUNT = 12;

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
          : cards.map((card, index) => {
              const Icon = getStatIcon(card.label);
              return (
                <StatCard
                  key={card.label}
                  to={CARD_ROUTES[index] || "#"}
                  color={CARD_COLORS[index % CARD_COLORS.length]}
                  label={card.label}
                  value={card.value}
                  icon={Icon}
                />
              );
            })}
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
