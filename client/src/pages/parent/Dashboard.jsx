import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
import LoadingBlock from "../../components/LoadingBlock";
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
  FiArrowRight,
} from "react-icons/fi";

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

const getStatIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes("student") || l.includes("child")) return FiUsers;
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

  if (loading) {
    return <LoadingBlock message="Loading dashboard stats..." />;
  }

  const quickActions = [
    { label: "View Attendance", route: "/parent/attendance", icon: FiCheckSquare, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "View Exams", route: "/parent/exams", icon: FiCalendar, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Assignments", route: "/parent/assignments", icon: FiEdit, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Fee Status", route: "/parent/fees", icon: FiCreditCard, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    { label: "View Notices", route: "/parent/notices", icon: FiFileText, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  ];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <PageHeader
        eyebrow="Parent"
        title="Dashboard Overview"
        description={`Monitor your children's progress with ${settings.appName}. Track attendance, view exam results, fee status, and more.`}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => {
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

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Common tasks for parents</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.route}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{action.label}</span>
                </div>
                <FiArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for parents and linked children." />
    </section>
  );
};

export default Dashboard;
