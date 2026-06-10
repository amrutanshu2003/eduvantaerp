import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import {
  getAcademicGroupLabel,
  getParentLabelPlural,
  getTeacherLabelPlural,
} from "../../utils/instituteLabels";

// Shimmer skeleton for a stat card
const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
    <div className="skeleton-block h-3 w-24 rounded-full" />
    <div className="skeleton-block mt-5 h-9 w-16 rounded-xl" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
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
    "bg-sky-500",
    "bg-fuchsia-500",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-orange-600",
    "bg-pink-600",
    "bg-cyan-600",
    "bg-indigo-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-teal-600",
    "bg-lime-600",
    "bg-violet-600",
    "bg-sky-600",
    "bg-fuchsia-600",
    "bg-red-700",
    "bg-green-700",
  ];

  const cardRoutes = [
    "/admin/students",
    "/admin/teachers",
    "/admin/parents",
    "/admin/staff",
    "/admin/academic-groups",
    "/admin/students",
    "/admin/staff",
    "/admin/subjects",
    "/admin/exams",
    "/admin/attendance",
    "/admin/marks",
    "/admin/results",
    "/admin/notices",
    "/admin/notices",
    "/admin/fees",
    "/admin/fees",
    "/admin/timetables",
    "/admin/assignments",
    "/admin/library/books",
    "/admin/library/books",
    "/admin/library/books",
    "/admin/library/books",
    "/admin/transport/vehicles",
    "/admin/transport/routes",
    "/admin/transport/allocations",
    "/admin/transport/vehicles",
    "/admin/hostels",
    "/admin/hostels",
    "/admin/hostel-beds",
    "/admin/hostel-beds",
    "/admin/hostel-allocations",
    "/admin/hostel-outpasses",
    "/admin/hostel-complaints",
  ];

  const cards = [
    { label: "Total Students", value: stats?.totalStudents ?? null },
    { label: `Total ${getTeacherLabelPlural(user)}`, value: stats?.totalTeachers ?? null },
    { label: `Total ${getParentLabelPlural(user)}`, value: stats?.totalParents ?? null },
    { label: "Total Staff", value: stats?.totalStaff ?? null },
    { label: `Total ${getAcademicGroupLabel(user)}`, value: stats?.totalAcademicGroups ?? null },
    { label: "Active Students", value: stats?.activeStudents ?? null },
    { label: "Active Staff", value: stats?.activeStaff ?? null },
    { label: "Total Subjects", value: phase4Stats?.totalSubjects ?? null },
    { label: "Total Exams", value: phase4Stats?.totalExams ?? null },
    { label: "Today Attendance", value: phase4Stats?.todayAttendanceCount ?? null },
    { label: "Pending Marks", value: phase4Stats?.pendingMarks ?? null },
    { label: "Published Results", value: phase4Stats?.publishedResults ?? null },
    { label: "Published Notices", value: phase4Stats?.publishedNotices ?? null },
    { label: "Draft Notices", value: phase4Stats?.draftNotices ?? null },
    { label: "Pending Fees", value: phase4Stats?.pendingFees ?? null },
    { label: "Paid Fees", value: phase4Stats?.paidFees ?? null },
    { label: "Active Timetables", value: phase4Stats?.activeTimetables ?? null },
    { label: "Active Assignments", value: phase4Stats?.activeAssignments ?? null },
    { label: "Total Books", value: phase4Stats?.totalBooks ?? null },
    { label: "Available Books", value: phase4Stats?.availableBooks ?? null },
    { label: "Issued Books", value: phase4Stats?.issuedBooks ?? null },
    { label: "Overdue Books", value: phase4Stats?.overdueBooks ?? null },
    { label: "Total Vehicles", value: phase4Stats?.totalVehicles ?? null },
    { label: "Active Routes", value: phase4Stats?.activeRoutes ?? null },
    { label: "Transport Students", value: phase4Stats?.transportStudents ?? null },
    { label: "Vehicles In Maintenance", value: phase4Stats?.vehiclesInMaintenance ?? null },
    { label: "Total Hostels", value: phase4Stats?.totalHostels ?? null },
    { label: "Active Hostels", value: phase4Stats?.activeHostels ?? null },
    { label: "Available Beds", value: phase4Stats?.availableBeds ?? null },
    { label: "Beds In Maintenance", value: phase4Stats?.bedsInMaintenance ?? null },
    { label: "Hostel Students", value: phase4Stats?.hostelStudents ?? null },
    { label: "Pending Outpasses", value: phase4Stats?.pendingHostelOutpasses ?? null },
    { label: "Open Hostel Complaints", value: phase4Stats?.openHostelComplaints ?? null },
  ];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) =>
          loading || card.value === null ? (
            <StatCardSkeleton key={card.label} />
          ) : (
            <Link
              key={card.label}
              to={cardRoutes[index]}
              className={`${cardColors[index]} rounded-[1.75rem] p-6 shadow-card transition hover:opacity-90 hover:scale-105`}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">{card.label}</p>
              <h3 className="mt-4 text-4xl font-semibold text-white">{card.value}</h3>
            </Link>
          )
        )}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Institute Admin Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage your institute operations seamlessly with {settings.appName}. Access integrated modules for academics, student records, fees, timetables, assignments, library, transport, and hostel management.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/admin/students" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Manage Students</Link>
          <Link to="/admin/academic-groups" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage {getAcademicGroupLabel(user)}</Link>
          <Link to="/admin/notices" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Notices</Link>
          <Link to="/admin/fees" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Fees</Link>
          <Link to="/admin/timetables" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Timetables</Link>
          <Link to="/admin/assignments" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Assignments</Link>
          <Link to="/admin/library/books" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Library</Link>
          <Link to="/admin/transport/vehicles" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Transport</Link>
          <Link to="/admin/hostels" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Manage Hostels</Link>
          <Link to="/admin/hostel-outpasses" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Review Outpasses</Link>
        </div>
      </div>

      <LatestNoticesPanel notices={latestNotices} description="Recently published notices for institute admins." />
    </section>
  );
};

export default Dashboard;
