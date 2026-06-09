import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import {
  getAcademicGroupLabel,
  getParentLabelPlural,
  getTeacherLabelPlural,
} from "../../utils/instituteLabels";

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

  if (loading) return <LoadingBlock message="Loading admin dashboard..." />;

  const cards = [
    { label: "Total Students", value: stats?.totalStudents || 0 },
    { label: `Total ${getTeacherLabelPlural(user)}`, value: stats?.totalTeachers || 0 },
    { label: `Total ${getParentLabelPlural(user)}`, value: stats?.totalParents || 0 },
    { label: "Total Staff", value: stats?.totalStaff || 0 },
    { label: `Total ${getAcademicGroupLabel(user)}`, value: stats?.totalAcademicGroups || 0 },
    { label: "Active Students", value: stats?.activeStudents || 0 },
    { label: "Active Staff", value: stats?.activeStaff || 0 },
    { label: "Total Subjects", value: phase4Stats?.totalSubjects || 0 },
    { label: "Total Exams", value: phase4Stats?.totalExams || 0 },
    { label: "Today Attendance", value: phase4Stats?.todayAttendanceCount || 0 },
    { label: "Pending Marks", value: phase4Stats?.pendingMarks || 0 },
    { label: "Published Results", value: phase4Stats?.publishedResults || 0 },
    { label: "Published Notices", value: phase4Stats?.publishedNotices || 0 },
    { label: "Draft Notices", value: phase4Stats?.draftNotices || 0 },
    { label: "Pending Fees", value: phase4Stats?.pendingFees || 0 },
    { label: "Paid Fees", value: phase4Stats?.paidFees || 0 },
    { label: "Active Timetables", value: phase4Stats?.activeTimetables || 0 },
    { label: "Active Assignments", value: phase4Stats?.activeAssignments || 0 },
    { label: "Total Books", value: phase4Stats?.totalBooks || 0 },
    { label: "Available Books", value: phase4Stats?.availableBooks || 0 },
    { label: "Issued Books", value: phase4Stats?.issuedBooks || 0 },
    { label: "Overdue Books", value: phase4Stats?.overdueBooks || 0 },
    { label: "Total Vehicles", value: phase4Stats?.totalVehicles || 0 },
    { label: "Active Routes", value: phase4Stats?.activeRoutes || 0 },
    { label: "Transport Students", value: phase4Stats?.transportStudents || 0 },
    { label: "Vehicles In Maintenance", value: phase4Stats?.vehiclesInMaintenance || 0 },
    { label: "Total Hostels", value: phase4Stats?.totalHostels || 0 },
    { label: "Active Hostels", value: phase4Stats?.activeHostels || 0 },
    { label: "Available Beds", value: phase4Stats?.availableBeds || 0 },
    { label: "Beds In Maintenance", value: phase4Stats?.bedsInMaintenance || 0 },
    { label: "Hostel Students", value: phase4Stats?.hostelStudents || 0 },
    { label: "Pending Outpasses", value: phase4Stats?.pendingHostelOutpasses || 0 },
    { label: "Open Hostel Complaints", value: phase4Stats?.openHostelComplaints || 0 },
  ];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] bg-white p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
            <h3 className="mt-4 text-4xl font-semibold text-ink">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Institute Admin Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage your institute operations seamlessly with Eduvanta ERP. Access integrated modules for academics, student records, fees, timetables, assignments, library, transport, and hostel management.
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
