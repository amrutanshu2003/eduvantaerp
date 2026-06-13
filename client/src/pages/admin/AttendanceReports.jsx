import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiCheckCircle, FiXCircle, FiAlertCircle, FiCalendar, FiTrendingUp, FiFilter } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const AttendanceReports = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const { data } = await api.get("/academic-groups");
        setGroups(data.academicGroups);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load academic groups");
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const fetchReport = async () => {
    if (!selectedGroup) return;
    setLoadingReport(true);
    try {
      const { data } = await api.get(`/attendance/reports/academic-group/${selectedGroup}`);
      setReport(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load attendance report");
    } finally {
      setLoadingReport(false);
    }
  };

  const filteredSummary = useMemo(() => {
    if (!report?.summary) return [];
    return report.summary.filter((item) => {
      const matchesSearch = 
        item.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "safe" && item.percentage >= 75) ||
        (statusFilter === "warning" && item.percentage < 75);
      
      return matchesSearch && matchesStatus;
    });
  }, [report?.summary, searchQuery, statusFilter]);

  const getOverallStats = useMemo(() => {
    if (!report?.summary) return null;
    const summary = report.summary;
    const totalStudents = summary.length;
    const avgPercentage = summary.reduce((sum, item) => sum + (item.percentage || 0), 0) / totalStudents;
    const totalPresent = summary.reduce((sum, item) => sum + (item.present || 0), 0);
    const totalAbsent = summary.reduce((sum, item) => sum + (item.absent || 0), 0);
    const totalLate = summary.reduce((sum, item) => sum + (item.late || 0), 0);
    const totalLeave = summary.reduce((sum, item) => sum + (item.leave || 0), 0);
    const safeStudents = summary.filter(item => item.percentage >= 75).length;
    const warningStudents = summary.filter(item => item.percentage < 75).length;
    
    return {
      totalStudents,
      avgPercentage: avgPercentage.toFixed(1),
      totalPresent,
      totalAbsent,
      totalLate,
      totalLeave,
      safeStudents,
      warningStudents
    };
  }, [report?.summary]);

  if (loading) return <LoadingBlock message="Loading attendance reports..." />;

  const stats = getOverallStats;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Attendance Reports" description="Review attendance summaries by academic group with detailed analytics." />
      <AlertMessage tone="error" message={errorMessage} />
      
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 mb-1 block">Academic Group</label>
            <select 
              value={selectedGroup} 
              onChange={(event) => setSelectedGroup(event.target.value)} 
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm outline-none dark:text-white"
            >
              <option value="">Select Academic Group</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.className || `${group.department} - ${group.course}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              type="button" 
              onClick={fetchReport} 
              disabled={!selectedGroup || loadingReport}
              className="w-full md:w-auto rounded-xl bg-slate-900 dark:bg-slate-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
              {loadingReport ? "Loading..." : "Load Report"}
            </button>
          </div>
        </div>
      </div>

      {report && stats && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-5 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  <FiUsers className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Safe Range (≥75%)</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">{stats.safeStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-5 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <FiAlertCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Below 75%</p>
                  <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-300 tabular-nums">{stats.warningStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-5 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <FiTrendingUp className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Avg Attendance</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">{stats.avgPercentage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Present</p>
              <p className="mt-2 text-xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">{stats.totalPresent}</p>
            </div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Total Absent</p>
              <p className="mt-2 text-xl font-bold text-red-800 dark:text-red-300 tabular-nums">{stats.totalAbsent}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Total Late</p>
              <p className="mt-2 text-xl font-bold text-amber-800 dark:text-amber-300 tabular-nums">{stats.totalLate}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 p-4 border border-sky-200 dark:border-sky-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Total Leave</p>
              <p className="mt-2 text-xl font-bold text-sky-800 dark:text-sky-300 tabular-nums">{stats.totalLeave}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search by student ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm outline-none dark:text-white w-full sm:w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm outline-none dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="safe">Safe (≥75%)</option>
                  <option value="warning">Below 75%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Student ID</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Student Name</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Present</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Absent</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Late</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Leave</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">%</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No students match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((item) => (
                      <tr key={item.studentId} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.studentId}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.studentName || "-"}</td>
                        <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{item.present}</td>
                        <td className="px-6 py-4 text-center text-red-600 dark:text-red-400 font-semibold tabular-nums">{item.absent}</td>
                        <td className="px-6 py-4 text-center text-amber-600 dark:text-amber-400 font-semibold tabular-nums">{item.late}</td>
                        <td className="px-6 py-4 text-center text-sky-600 dark:text-sky-400 font-semibold tabular-nums">{item.leave}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-slate-100 tabular-nums">{item.percentage}%</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.percentage >= 75
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {item.percentage >= 75 ? "Safe" : "Warning"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/admin/attendance/students/${item.studentId}`} 
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <FiCalendar className="w-3 h-3" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AttendanceReports;
