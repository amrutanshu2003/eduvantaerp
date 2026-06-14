import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiFilter, FiTrendingUp, FiUsers, FiXCircle } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";
import { getAttendanceBand, getAttendanceSettings, withAlpha } from "../../utils/attendanceSettings";

const AttendanceReports = () => {
  const { settings } = useUISettings();
  const attendanceSettings = getAttendanceSettings(settings);
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

      const band = getAttendanceBand(item.percentage || 0, 1, settings);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "safe" && band.key === "good") ||
        (statusFilter === "warning" && band.key === "warning") ||
        (statusFilter === "critical" && band.key === "critical");

      return matchesSearch && matchesStatus;
    });
  }, [report?.summary, searchQuery, settings, statusFilter]);

  const stats = useMemo(() => {
    if (!report?.summary?.length) return null;

    const summary = report.summary;
    const totalStudents = summary.length;
    const avgPercentage = summary.reduce((sum, item) => sum + (item.percentage || 0), 0) / totalStudents;
    const totalPresent = summary.reduce((sum, item) => sum + (item.present || 0), 0);
    const totalAbsent = summary.reduce((sum, item) => sum + (item.absent || 0), 0);
    const totalLate = summary.reduce((sum, item) => sum + (item.late || 0), 0);
    const totalLeave = summary.reduce((sum, item) => sum + (item.leave || 0), 0);
    const safeStudents = summary.filter((item) => getAttendanceBand(item.percentage || 0, 1, settings).key === "good").length;
    const warningStudents = summary.filter((item) => getAttendanceBand(item.percentage || 0, 1, settings).key === "warning").length;
    const criticalStudents = summary.filter((item) => getAttendanceBand(item.percentage || 0, 1, settings).key === "critical").length;

    return {
      totalStudents,
      avgPercentage: avgPercentage.toFixed(1),
      totalPresent,
      totalAbsent,
      totalLate,
      totalLeave,
      safeStudents,
      warningStudents,
      criticalStudents,
    };
  }, [report?.summary, settings]);

  if (loading) return <LoadingBlock message="Loading attendance reports..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Attendance Reports" description="Review attendance summaries by academic group with detailed analytics." />
      <AlertMessage tone="error" message={errorMessage} />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="mb-1 block px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Academic Group</label>
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {loadingReport ? "Loading..." : "Load Report"}
            </button>
          </div>
        </div>
      </div>

      {report && stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
                  <FiUsers className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: withAlpha(attendanceSettings.goodColor, 0.28), backgroundColor: withAlpha(attendanceSettings.goodColor, 0.12) }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(attendanceSettings.goodColor, 0.16), color: attendanceSettings.goodColor }}>
                  <FiCheckCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: attendanceSettings.goodColor }}>Safe Range (≥{attendanceSettings.goodThreshold}%)</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: attendanceSettings.goodColor }}>{stats.safeStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: withAlpha(attendanceSettings.warningColor, 0.32), backgroundColor: withAlpha(attendanceSettings.warningColor, 0.18) }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(attendanceSettings.warningColor, 0.2), color: attendanceSettings.warningColor }}>
                  <FiTrendingUp className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: attendanceSettings.warningColor }}>Needs Attention</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: attendanceSettings.warningColor }}>{stats.warningStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: withAlpha(attendanceSettings.criticalColor, 0.28), backgroundColor: withAlpha(attendanceSettings.criticalColor, 0.12) }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(attendanceSettings.criticalColor, 0.18), color: attendanceSettings.criticalColor }}>
                  <FiAlertCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: attendanceSettings.criticalColor }}>Critical (&lt;{attendanceSettings.warningThreshold}%)</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: attendanceSettings.criticalColor }}>{stats.criticalStudents}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                  <FiTrendingUp className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Avg Attendance</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-800 dark:text-indigo-300">{stats.avgPercentage}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Present</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{stats.totalPresent}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Total Absent</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-red-800 dark:text-red-300">{stats.totalAbsent}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Total Late</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-amber-800 dark:text-amber-300">{stats.totalLate}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Total Leave</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-sky-800 dark:text-sky-300">{stats.totalLeave}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
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
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none sm:w-64 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="safe">Safe (≥{attendanceSettings.goodThreshold}%)</option>
                  <option value="warning">Needs Attention</option>
                  <option value="critical">Critical (&lt;{attendanceSettings.warningThreshold}%)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Present</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Absent</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Late</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Leave</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">%</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Details</th>
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
                    filteredSummary.map((item) => {
                      const band = getAttendanceBand(item.percentage || 0, 1, settings);

                      return (
                        <tr key={item.studentId} className="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.studentId}</td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.studentName || "-"}</td>
                          <td className="px-6 py-4 text-center font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{item.present}</td>
                          <td className="px-6 py-4 text-center font-semibold tabular-nums text-red-600 dark:text-red-400">{item.absent}</td>
                          <td className="px-6 py-4 text-center font-semibold tabular-nums text-amber-600 dark:text-amber-400">{item.late}</td>
                          <td className="px-6 py-4 text-center font-semibold tabular-nums text-sky-600 dark:text-sky-400">{item.leave}</td>
                          <td className="px-6 py-4 text-center font-bold tabular-nums text-slate-900 dark:text-slate-100">{item.percentage}%</td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: withAlpha(band.toneColor, 0.14),
                                color: band.toneColor,
                              }}
                            >
                              {band.key === "good" ? "Safe" : band.key === "warning" ? "Needs Attention" : "Critical"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/admin/attendance/students/${item.studentId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <FiCalendar className="h-3 w-3" />
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default AttendanceReports;
