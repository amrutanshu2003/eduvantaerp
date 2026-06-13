import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { useLabelSettings } from "../../context/LabelSettingsContext";
import {
  getAcademicGroupLabel,
  getParentLabelPlural,
  getTeacherLabelPlural,
} from "../../utils/instituteLabels";
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
  FiMap,
  FiHome,
  FiPackage,
  FiArrowRight,
  FiPlus,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const { isModuleEnabled } = useLabelSettings();
  const [stats, setStats] = useState(null);
  const [phase4Stats, setPhase4Stats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ data }, { data: phase4Data }] = await Promise.all([
          api.get("/admin/dashboard-stats"),
          api.get("/phase4-dashboard/admin"),
        ]);
        setStats(data.stats);
        setPhase4Stats(phase4Data.stats);
        setLatestNotices(phase4Data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const allCards = [
    { label: "Total Students", value: stats?.totalStudents ?? null, module: "students", route: "/admin/students", color: "bg-blue-500", icon: FiUsers },
    { label: `Total ${getTeacherLabelPlural(user)}`, value: stats?.totalTeachers ?? null, module: "teachers", route: "/admin/teachers", color: "bg-emerald-500", icon: FiUser },
    { label: `Total ${getParentLabelPlural(user)}`, value: stats?.totalParents ?? null, module: "parents", route: "/admin/parents", color: "bg-purple-500", icon: FiShield },
    { label: "Total Staff", value: stats?.totalStaff ?? null, module: "staff", route: "/admin/staff", color: "bg-orange-500", icon: FiLayers },
    { label: `Total ${getAcademicGroupLabel(user)}`, value: stats?.totalAcademicGroups ?? null, module: "academics", route: "/admin/academic-groups", color: "bg-pink-500", icon: FiBookOpen },
    { label: "Active Students", value: stats?.activeStudents ?? null, module: "students", route: "/admin/students", color: "bg-cyan-500", icon: FiUsers },
    { label: "Active Staff", value: stats?.activeStaff ?? null, module: "staff", route: "/admin/staff", color: "bg-indigo-500", icon: FiLayers },
    { label: "Total Subjects", value: phase4Stats?.totalSubjects ?? null, module: "subjects", route: "/admin/subjects", color: "bg-rose-500", icon: FiBookOpen },
    { label: "Total Exams", value: phase4Stats?.totalExams ?? null, module: "exams", route: "/admin/exams", color: "bg-amber-500", icon: FiCalendar },
    { label: "Today Attendance", value: phase4Stats?.todayAttendanceCount ?? null, module: "attendance", route: "/admin/attendance", color: "bg-teal-500", icon: FiCheckSquare },
    { label: "Pending Marks", value: phase4Stats?.pendingMarks ?? null, module: "marks", route: "/admin/marks", color: "bg-lime-500", icon: FiEdit },
    { label: "Published Results", value: phase4Stats?.publishedResults ?? null, module: "marks", route: "/admin/results", color: "bg-violet-500", icon: FiFileText },
    { label: "Published Notices", value: phase4Stats?.publishedNotices ?? null, module: "notices", route: "/admin/notices", color: "bg-sky-500", icon: FiFileText },
    { label: "Draft Notices", value: phase4Stats?.draftNotices ?? null, module: "notices", route: "/admin/notices", color: "bg-fuchsia-500", icon: FiFileText },
    { label: "Pending Fees", value: phase4Stats?.pendingFees ?? null, module: "fees", route: "/admin/fees", color: "bg-red-500", icon: FiCreditCard },
    { label: "Paid Fees", value: phase4Stats?.paidFees ?? null, module: "fees", route: "/admin/fees", color: "bg-green-500", icon: FiCreditCard },
    { label: "Active Timetables", value: phase4Stats?.activeTimetables ?? null, module: "timetable", route: "/admin/timetables", color: "bg-yellow-500", icon: FiClock },
    { label: "Active Assignments", value: phase4Stats?.activeAssignments ?? null, module: "assignments", route: "/admin/assignments", color: "bg-blue-600", icon: FiEdit },
    { label: "Total Books", value: phase4Stats?.totalBooks ?? null, module: "library", route: "/admin/library/books", color: "bg-emerald-600", icon: FiBookOpen },
    { label: "Available Books", value: phase4Stats?.availableBooks ?? null, module: "library", route: "/admin/library/books", color: "bg-purple-600", icon: FiBookOpen },
    { label: "Issued Books", value: phase4Stats?.issuedBooks ?? null, module: "library", route: "/admin/library/books", color: "bg-orange-600", icon: FiFileText },
    { label: "Overdue Books", value: phase4Stats?.overdueBooks ?? null, module: "library", route: "/admin/library/books", color: "bg-pink-600", icon: FiCalendar },
    { label: "Total Vehicles", value: phase4Stats?.totalVehicles ?? null, module: "transport", route: "/admin/transport/vehicles", color: "bg-cyan-600", icon: FiTruck },
    { label: "Active Routes", value: phase4Stats?.activeRoutes ?? null, module: "transport", route: "/admin/transport/routes", color: "bg-indigo-600", icon: FiMap },
    { label: "Transport Students", value: phase4Stats?.transportStudents ?? null, module: "transport", route: "/admin/transport/allocations", color: "bg-rose-600", icon: FiUsers },
    { label: "Vehicles In Maintenance", value: phase4Stats?.vehiclesInMaintenance ?? null, module: "transport", route: "/admin/transport/vehicles", color: "bg-amber-600", icon: FiTruck },
    { label: "Total Hostels", value: phase4Stats?.totalHostels ?? null, module: "hostel", route: "/admin/hostels", color: "bg-teal-600", icon: FiHome },
    { label: "Active Hostels", value: phase4Stats?.activeHostels ?? null, module: "hostel", route: "/admin/hostels", color: "bg-lime-600", icon: FiHome },
    { label: "Available Beds", value: phase4Stats?.availableBeds ?? null, module: "hostel", route: "/admin/hostel-beds", color: "bg-violet-600", icon: FiPackage },
    { label: "Beds In Maintenance", value: phase4Stats?.bedsInMaintenance ?? null, module: "hostel", route: "/admin/hostel-beds", color: "bg-sky-600", icon: FiPackage },
    { label: "Hostel Students", value: phase4Stats?.hostelStudents ?? null, module: "hostel", route: "/admin/hostel-allocations", color: "bg-fuchsia-600", icon: FiUsers },
    { label: "Pending Outpasses", value: phase4Stats?.pendingHostelOutpasses ?? null, module: "hostel", route: "/admin/hostel-outpasses", color: "bg-red-700", icon: FiFileText },
    { label: "Open Hostel Complaints", value: phase4Stats?.openHostelComplaints ?? null, module: "hostel", route: "/admin/hostel-complaints", color: "bg-green-700", icon: FiShield },
  ];

  const cards = allCards.filter(card => !card.module || isModuleEnabled(card.module));

  if (loading) {
    return <LoadingBlock message="Loading dashboard stats..." />;
  }

  const quickActions = [
    ...(isModuleEnabled("students") ? [{ label: "Manage Students", route: "/admin/students", icon: FiUsers, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" }] : []),
    ...(isModuleEnabled("academics") ? [{ label: `Manage ${getAcademicGroupLabel(user)}`, route: "/admin/academic-groups", icon: FiBookOpen, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" }] : []),
    ...(isModuleEnabled("notices") ? [{ label: "Manage Notices", route: "/admin/notices", icon: FiFileText, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }] : []),
    ...(isModuleEnabled("fees") ? [{ label: "Manage Fees", route: "/admin/fees", icon: FiCreditCard, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" }] : []),
    ...(isModuleEnabled("timetable") ? [{ label: "Manage Timetables", route: "/admin/timetables", icon: FiClock, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" }] : []),
    ...(isModuleEnabled("assignments") ? [{ label: "View Assignments", route: "/admin/assignments", icon: FiEdit, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" }] : []),
    ...(isModuleEnabled("library") ? [{ label: "Manage Library", route: "/admin/library/books", icon: FiBookOpen, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" }] : []),
    ...(isModuleEnabled("transport") ? [{ label: "Manage Transport", route: "/admin/transport/vehicles", icon: FiTruck, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" }] : []),
    ...(isModuleEnabled("hostel") ? [{ label: "Manage Hostels", route: "/admin/hostels", icon: FiHome, color: "bg-teal-500/10 text-teal-600 dark:text-teal-400" }] : []),
    ...(isModuleEnabled("hostel") ? [{ label: "Review Outpasses", route: "/admin/hostel-outpasses", icon: FiShield, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" }] : []),
  ];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />

      <PageHeader
        eyebrow="Institute Admin"
        title="Dashboard Overview"
        description={`Manage your institute operations seamlessly with ${settings.appName}. Access integrated modules for academics, student records, fees, timetables, assignments, library, transport, and hostel management.`}
        actions={
          <Link
            to="/admin/bulk-import"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-lg active:scale-95"
          >
            <FiPlus className="h-4 w-4" />
            Bulk Import
          </Link>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return card.value === null ? (
            <StatCardSkeleton key={card.label} />
          ) : (
            <StatCard
              key={card.label}
              to={card.route}
              color={card.color}
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
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Common tasks for institute admin</p>
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

      <LatestNoticesPanel notices={latestNotices} description="Recently published notices for institute admins." />
    </section>
  );
};

export default Dashboard;
