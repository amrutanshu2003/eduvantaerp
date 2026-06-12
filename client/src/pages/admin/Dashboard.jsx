import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
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

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return loading || card.value === null ? (
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

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Institute Admin Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage your institute operations seamlessly with {settings.appName}. Access integrated modules for academics, student records, fees, timetables, assignments, library, transport, and hostel management.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {isModuleEnabled("students") && (
            <Link to="/admin/students" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Manage Students</Link>
          )}
          {isModuleEnabled("academics") && (
            <Link to="/admin/academic-groups" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage {getAcademicGroupLabel(user)}</Link>
          )}
          {isModuleEnabled("notices") && (
            <Link to="/admin/notices" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Notices</Link>
          )}
          {isModuleEnabled("fees") && (
            <Link to="/admin/fees" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Fees</Link>
          )}
          {isModuleEnabled("timetable") && (
            <Link to="/admin/timetables" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Timetables</Link>
          )}
          {isModuleEnabled("assignments") && (
            <Link to="/admin/assignments" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Assignments</Link>
          )}
          {isModuleEnabled("library") && (
            <Link to="/admin/library/books" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Library</Link>
          )}
          {isModuleEnabled("transport") && (
            <Link to="/admin/transport/vehicles" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Transport</Link>
          )}
          {isModuleEnabled("hostel") && (
            <Link to="/admin/hostels" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Hostels</Link>
          )}
          {isModuleEnabled("hostel") && (
            <Link to="/admin/hostel-outpasses" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Review Outpasses</Link>
          )}
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Recently published notices for institute admins." />
    </section>
  );
};

export default Dashboard;
