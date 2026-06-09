import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiSearch,
  FiBookOpen,
  FiClock,
  FiGrid,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Attendance = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/attendance/reports/my-attendance");
        setReport(data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading your attendance..." />;

  const getStatusDetails = (status) => {
    switch (status) {
      case "present":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <FiCheckCircle className="text-emerald-500 shrink-0" />,
          label: "Present",
        };
      case "absent":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-100",
          icon: <FiXCircle className="text-rose-500 shrink-0" />,
          label: "Absent",
        };
      case "late":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-100",
          icon: <FiAlertCircle className="text-amber-500 shrink-0" />,
          label: "Late",
        };
      case "leave":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-100",
          icon: <FiCalendar className="text-blue-500 shrink-0" />,
          label: "Leave",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <FiAlertCircle className="text-slate-500 shrink-0" />,
          label: "Unknown",
        };
    }
  };

  const formatDateString = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter attendance list
  const filteredAttendance = (report?.attendance || []).filter((item) => {
    const subjectName = item.subjectId?.subjectName || "general class attendance";
    const subjectCode = item.subjectId?.subjectCode || "";
    const matchesSearch =
      subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDateString(item.date).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.studentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Attendance"
        description="Monitor your class attendance stats, subjects, and complete history."
      />
      <AlertMessage tone="error" message={errorMessage} />

      {report && (
        <>
          {/* Summary Cards with Premium Designs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Percentage Card (Indigo Gradient) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-lg"></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Overall Attendance</p>
              <p className="mt-4 text-4xl font-extrabold tracking-tight tabular-nums">
                {report.summary?.percentage || 0}%
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, report.summary?.percentage || 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Present Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Present</p>
                <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{report.summary?.present || 0}</p>
              </div>
            </div>

            {/* Absent Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FiXCircle className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Absent</p>
                <p className="mt-1 text-2xl font-bold text-rose-600 tabular-nums">{report.summary?.absent || 0}</p>
              </div>
            </div>

            {/* Late Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiAlertCircle className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Late</p>
                <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{report.summary?.late || 0}</p>
              </div>
            </div>

            {/* Leave Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiCalendar className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leave</p>
                <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{report.summary?.leave || 0}</p>
              </div>
            </div>
          </div>

          {/* Records Search and Filters */}
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-ink">Attendance Log</h2>
              
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subject or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Records", count: report.attendance?.length || 0 },
                { id: "present", label: "Present", count: report.summary?.present || 0 },
                { id: "absent", label: "Absent", count: report.summary?.absent || 0 },
                { id: "late", label: "Late", count: report.summary?.late || 0 },
                { id: "leave", label: "Leave", count: report.summary?.leave || 0 },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold border transition-all ${
                    statusFilter === filter.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* Log List */}
            <div className="space-y-4">
              {filteredAttendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FiGrid className="text-4xl text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-500">No attendance records found</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your search query or filter options.</p>
                </div>
              ) : (
                filteredAttendance.map((item) => {
                  const status = getStatusDetails(item.studentStatus);
                  return (
                    <div
                      key={item._id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 p-5 transition-all hover:border-slate-200 hover:shadow-sm md:flex-row md:items-center bg-slate-50/50"
                    >
                      {/* Left: Subject and Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FiBookOpen className="text-indigo-500 shrink-0" />
                          <h4 className="font-semibold text-ink">
                            {item.subjectId?.subjectName || "General Class Attendance"}
                          </h4>
                          {item.subjectId?.subjectCode && (
                            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                              {item.subjectId.subjectCode}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <FiCalendar className="text-slate-400" />
                            {formatDateString(item.date)}
                          </span>
                          {item.startTime && (
                            <span className="flex items-center gap-1.5">
                              <FiClock className="text-slate-400" />
                              {item.startTime} {item.endTime ? ` - ${item.endTime}` : ""}
                            </span>
                          )}
                        </div>
                        {item.studentRemarks && (
                          <p className="text-xs text-slate-500 italic bg-amber-50/50 inline-block px-2.5 py-1 rounded-lg border border-amber-100/60 mt-1">
                            Remarks: {item.studentRemarks}
                          </p>
                        )}
                      </div>

                      {/* Right: Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${status.bg}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Attendance;
