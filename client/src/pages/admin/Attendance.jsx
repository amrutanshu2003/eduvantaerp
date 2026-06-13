import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiAlertCircle, FiClock, FiFilter, FiSearch } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/attendance");
      setAttendance(data.attendance || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleDelete = async (attendanceId) => {
    if (!(await window.confirm("Are you sure you want to delete this attendance record? This will move it to the Recycle Bin."))) {
      return;
    }

    try {
      await api.delete(`/attendance/${attendanceId}`);
      setSuccessMessage("Attendance record deleted successfully");
      setAttendance((current) => current.filter((item) => item._id !== attendanceId));
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete attendance record");
    }
  };

  const uniqueGroups = useMemo(() => {
    const groups = new Set();
    attendance.forEach((record) => {
      if (record.academicGroupId?._id) {
        groups.add(record.academicGroupId._id);
      }
    });
    return Array.from(groups);
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const groupName = record.academicGroupId?.className || 
        [record.academicGroupId?.department, record.academicGroupId?.course, record.academicGroupId?.section].filter(Boolean).join(" - ") || "";
      const subjectName = record.subjectId?.subjectName || "General Attendance";
      const markedByName = record.markedBy?.name || "";
      
      const matchesSearch =
        groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        markedByName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGroup = groupFilter === "all" || record.academicGroupId?._id === groupFilter;
      
      const totalStudents = record.records?.length || 0;
      const presentStudents = record.records?.filter((r) => r.status === "present" || r.status === "late").length || 0;
      const percentage = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "high" && percentage >= 75) ||
        (statusFilter === "low" && percentage < 75);
      
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [attendance, searchQuery, groupFilter, statusFilter]);

  const overallStats = useMemo(() => {
    if (attendance.length === 0) return null;
    const totalRecords = attendance.length;
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    
    attendance.forEach((record) => {
      const records = record.records || [];
      totalStudents += records.length;
      records.forEach((r) => {
        if (r.status === "present") totalPresent++;
        else if (r.status === "absent") totalAbsent++;
        else if (r.status === "late") totalLate++;
        else if (r.status === "leave") totalLeave++;
      });
    });
    
    const avgAttendance = totalStudents > 0 ? ((totalPresent + totalLate) / totalStudents) * 100 : 0;
    
    return {
      totalRecords,
      totalStudents,
      totalPresent,
      totalAbsent,
      totalLate,
      totalLeave,
      avgAttendance: avgAttendance.toFixed(1)
    };
  }, [attendance]);

  if (loading) return <LoadingBlock message="Loading attendance records..." />;

  const stats = overallStats;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Attendance Records"
        description="View and manage attendance sheets submitted across classes and academic groups."
      />

      <AlertMessage tone="error" message={errorMessage} />
      <AlertMessage tone="success" message={successMessage} />

      {attendance.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="There are currently no attendance submissions recorded."
        />
      ) : (
        <>
          {/* Summary Cards */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-5 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                    <FiCalendar className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Records</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{stats.totalRecords}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <FiCheckCircle className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Present</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">{stats.totalPresent}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-5 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <FiXCircle className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Total Absent</p>
                    <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-300 tabular-nums">{stats.totalAbsent}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-5 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <FiUsers className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Avg Attendance</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">{stats.avgAttendance}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by group, subject, or teacher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 pr-4 py-2 text-sm outline-none dark:text-white w-full sm:w-64"
                  />
                </div>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm outline-none dark:text-white"
                >
                  <option value="all">All Groups</option>
                  {attendance.map((record) => (
                    record.academicGroupId && (
                      <option key={record.academicGroupId._id} value={record.academicGroupId._id}>
                        {record.academicGroupId.className || [record.academicGroupId.department, record.academicGroupId.course, record.academicGroupId.section].filter(Boolean).join(" - ")}
                      </option>
                    )
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm outline-none dark:text-white"
                >
                  <option value="all">All Attendance</option>
                  <option value="high">High (≥75%)</option>
                  <option value="low">Low (&lt;75%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Academic Group</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Subject</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Marked By</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Present</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Total</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">%</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No attendance records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const totalStudents = record.records?.length || 0;
                      const presentStudents = record.records?.filter((r) => r.status === "present" || r.status === "late").length || 0;
                      const percentage = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={record._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-slate-400 w-4 h-4" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {record.date ? new Date(record.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                }) : "-"}
                              </span>
                            </div>
                            {record.startTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <FiClock className="text-slate-400 w-3 h-3" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {record.startTime} {record.endTime ? `- ${record.endTime}` : ""}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {record.academicGroupId?.className || [record.academicGroupId?.department, record.academicGroupId?.course, record.academicGroupId?.section].filter(Boolean).join(" - ") || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {record.subjectId?.subjectName || "General Attendance"}
                              </p>
                              {record.subjectId?.subjectCode && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{record.subjectId.subjectCode}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{record.markedBy?.name || "-"}</span>
                              {record.markedBy?.role && (
                                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">({record.markedBy.role})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{presentStudents}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-600 dark:text-slate-400 tabular-nums">{totalStudents}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold tabular-nums ${
                              percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            }`}>
                              {percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/admin/attendance/${record._id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(record._id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
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
      )}
    </section>
  );
};

export default Attendance;
