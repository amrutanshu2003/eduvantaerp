import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, isHostelSecurityUser } from "../../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../../utils/transportAccess";
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

const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
    <div className="skeleton-block h-3 w-24 rounded-full" />
    <div className="skeleton-block mt-5 h-9 w-16 rounded-xl" />
  </div>
);

const CARD_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-rose-500",
];

const CARD_ROUTES = [
  "/staff/attendance", "/staff/library", "/staff/transport",
  "/staff/hostel", "/staff/notices", "/staff/fees",
  "/staff/exams", "/staff/assignments",
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

const SKELETON_COUNT = 4;

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

  const cards = visibleStats.map(([key, value]) => ({ label: formatLabel(key), value }));

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : cards.map((card, index) => {
              const Icon = getStatIcon(card.label);
              return (
                <Link
                  key={card.label}
                  to={CARD_ROUTES[index] || "#"}
                  className={`${CARD_COLORS[index % CARD_COLORS.length]} rounded-[1.75rem] p-6 shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden`}
                >
                  <div className="absolute right-5 top-5 text-white/25 text-3xl">
                    <Icon />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{card.label}</p>
                  <h3 className="mt-4 text-4xl font-bold tracking-tight text-white">{card.value}</h3>
                </Link>
              );
            })}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Staff Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage your staff responsibilities with {settings.appName}. Access library, transport, hostel, and other modules based on your designation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/staff/notices" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">View Notices</Link>
          <Link to="/staff/library/books" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Library</Link>
          <Link to="/staff/transport/vehicles" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Transport</Link>
          <Link to="/staff/hostels" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Hostel</Link>
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for staff members." />
    </section>
  );
};

export default Dashboard;
