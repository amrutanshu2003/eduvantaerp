import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiEdit,
  FiFileText,
  FiHome,
  FiInfo,
  FiLayers,
  FiShield,
  FiTruck,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/ui/SectionCard";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";

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

const getAttendanceTone = (percentage, totalUnits) => {
  if (!totalUnits) {
    return {
      ring: "#64748b",
      track: "#e2e8f0",
      centerText: "text-slate-600 dark:text-slate-300",
      helperText: "text-slate-500 dark:text-slate-400",
      glow: "shadow-[0_16px_40px_rgba(100,116,139,0.12)]",
      chip: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600/40 dark:bg-slate-700/30 dark:text-slate-200",
      badge: "No Data",
      helper: "No attendance records yet",
      footer: "No records",
    };
  }

  if (percentage >= 80) {
    return {
      ring: "#15803d",
      track: "#d1fae5",
      centerText: "text-emerald-700 dark:text-emerald-300",
      helperText: "text-slate-500 dark:text-slate-400",
      glow: "shadow-[0_18px_46px_rgba(21,128,61,0.16)]",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
      badge: "Good Standing",
      helper: "Good Standing",
      footer: "Based on attendance units",
    };
  }

  if (percentage >= 60) {
    return {
      ring: "#d97706",
      track: "#fef3c7",
      centerText: "text-amber-700 dark:text-amber-300",
      helperText: "text-slate-500 dark:text-slate-400",
      glow: "shadow-[0_18px_46px_rgba(217,119,6,0.16)]",
      chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
      badge: "Needs Attention",
      helper: "Needs Attention",
      footer: "Based on attendance units",
    };
  }

  return {
    ring: "#dc2626",
    track: "#fee2e2",
    centerText: "text-rose-700 dark:text-rose-300",
    helperText: "text-slate-500 dark:text-slate-400",
    glow: "shadow-[0_18px_46px_rgba(220,38,38,0.16)]",
    chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    badge: "Critical",
    helper: "Critical",
    footer: "Based on attendance units",
  };
};

const formatPercentage = (value, totalUnits) => {
  if (!totalUnits) {
    return "--";
  }

  if (!Number.isFinite(value)) {
    return "0%";
  }

  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}%`;
};

const CircularAttendanceCard = ({ label, summary, animated }) => {
  const percentage = Number(summary?.percentage || 0);
  const totalUnits = Number(summary?.totalUnits || 0);
  const { ring, track, centerText, helperText, badge } = getAttendanceTone(percentage, totalUnits);
  const compactLabel = label.replace(" Attendance", "");
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const progress = totalUnits > 0 && animated ? safePercentage : 0;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[0.92rem] font-semibold leading-tight text-white sm:text-base sm:text-slate-900 dark:sm:text-slate-100">
        {compactLabel}
      </p>

      <div className="mt-3 flex items-center justify-center sm:mt-4">
        <div className="relative h-[74px] w-[74px] sm:h-[112px] sm:w-[112px] lg:h-[146px] lg:w-[146px]">
          <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={track}
              strokeWidth="12"
              className="opacity-90 dark:stroke-slate-700"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={ring}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 240ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[0.95rem] font-semibold leading-none sm:text-[1.35rem] lg:text-[1.7rem] ${centerText}`}>{formatPercentage(percentage, totalUnits)}</span>
          </div>
        </div>
      </div>

      {totalUnits === 0 ? <p className={`mt-3 text-[11px] font-medium leading-4 ${helperText} sm:text-sm`}>No records</p> : null}
    </div>
  );
};

const Dashboard = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [dashboard, setDashboard] = useState({ stats: null, latestNotices: [], attendanceSummary: null, recentAttendance: [], recentAssignments: [], feeSummary: null });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [animateRings, setAnimateRings] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/student");
        setDashboard({
          stats: data.stats,
          latestNotices: data.latestNotices || [],
          attendanceSummary: data.attendanceSummary || null,
          recentAttendance: data.recentAttendance || [],
          recentAssignments: data.recentAssignments || [],
          feeSummary: data.feeSummary || null,
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load student dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setAnimateRings(true), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [loading]);

  const cards = dashboard.stats
    ? Object.entries(dashboard.stats).map(([key, value]) => ({ label: formatLabel(key), value }))
    : [];

  const quickActions = [
    { label: "View Attendance", route: "/student/attendance", icon: FiCheckSquare, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "View Exams", route: "/student/exams", icon: FiCalendar, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Assignments", route: "/student/assignments", icon: FiEdit, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "View Marks", route: "/student/marks", icon: FiFileText, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    { label: "Fee Status", route: "/student/fees", icon: FiCreditCard, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
    { label: "View Notices", route: "/student/notices", icon: FiFileText, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  ];

  const attendanceCards = useMemo(() => {
    const summary = dashboard.attendanceSummary || {};
    return [
      { label: "Theory Attendance", summary: summary.theory || { presentUnits: 0, totalUnits: 0, percentage: 0 } },
      { label: "Practical Attendance", summary: summary.practical || { presentUnits: 0, totalUnits: 0, percentage: 0 } },
      { label: "Total Attendance", summary: summary.total || { presentUnits: 0, totalUnits: 0, percentage: 0 } },
    ];
  }, [dashboard.attendanceSummary]);

  const allAttendanceCardsEmpty = attendanceCards.every((card) => Number(card.summary?.totalUnits || 0) === 0);

  if (loading) {
    return <LoadingBlock message="Loading dashboard stats..." />;
  }

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <PageHeader
        eyebrow="Student"
        title="Dashboard Overview"
        description={`Welcome to ${settings.appName}. Track your attendance, view exam results, check fees, assignments, and more.`}
      />

      <div className="py-1">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {attendanceCards.map((card) => (
            <CircularAttendanceCard key={card.label} label={card.label} summary={card.summary} animated={animateRings} />
          ))}
        </div>
      </div>

      {allAttendanceCardsEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          No attendance data available yet.
        </div>
      ) : null}

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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Attendance</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Latest marked periods with unit-aware status tracking.</p>
            </div>
            <Link
              to="/student/attendance"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Open register
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {dashboard.recentAttendance.length > 0 ? dashboard.recentAttendance.map((entry) => (
              <div key={entry._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{entry.subjectName || "General Class"}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {" • "}
                    {entry.attendanceCount || 1} unit{(entry.attendanceCount || 1) > 1 ? "s" : ""}
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.studentStatus === "present"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : entry.studentStatus === "late"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      : entry.studentStatus === "leave"
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                }`}>
                  {formatLabel(entry.studentStatus || "unknown")}
                </span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Recent attendance will appear here once attendance is marked.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Fees Snapshot</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Outstanding totals and payment mix from your current fee records.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Records</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">{dashboard.feeSummary?.pendingCount || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding Amount</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">{dashboard.feeSummary?.outstandingAmount || 0}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Paid / Partial / Overdue</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {dashboard.feeSummary?.paidCount || 0} / {dashboard.feeSummary?.partialCount || 0} / {dashboard.feeSummary?.overdueCount || 0}
              </p>
            </div>
            <Link
              to="/student/fees"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{
                background: settings.primaryColor,
                borderRadius: getButtonRadius(settings.buttonStyle),
              }}
            >
              View fees
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Common tasks for students</p>
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

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Assignments</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Latest homework, lab work, and project deadlines.</p>
            </div>
            <Link
              to="/student/assignments"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View all
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {dashboard.recentAssignments.length > 0 ? dashboard.recentAssignments.map((assignment) => (
              <div key={assignment._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-800/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{assignment.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {assignment.subjectName || "Subject"} • Due {new Date(assignment.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    assignment.submissionStatus === "reviewed"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : assignment.submissionStatus === "submitted" || assignment.submissionStatus === "late"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}>
                    {formatLabel(assignment.submissionStatus || "pending")}
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Published assignments will show here.
              </div>
            )}
          </div>
        </SectionCard>

        <LatestNoticesPanel notices={dashboard.latestNotices} description="Latest published notices for you and your academic group." />
      </div>
    </section>
  );
};

export default Dashboard;
