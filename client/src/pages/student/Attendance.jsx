import { useEffect, useState, useMemo } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiSearch,
  FiBookOpen,
  FiClock,
  FiGrid,
  FiTrendingUp,
  FiFilter,
  FiUser,
  FiInfo,
  FiList,
  FiTable,
  FiArrowRight,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";
import { getAttendanceBand, withAlpha } from "../../utils/attendanceSettings";

const getSubjectAbbreviation = (subjectName, subjectCode, shortName) => {
  if (shortName) return shortName.toUpperCase();

  const knownMap = {
    "General Class": "GC",
    "Quantum Mechanics": "QM",
    "Electrodynamics": "ED",
    "Solid State Physics": "SS",
    "Classical Mechanics": "CM",
    "Quantum Field Theory": "QF",
    "Advanced Mathematics": "AM",
    "Research Methodology": "RM"
  };

  if (subjectName && knownMap[subjectName]) {
    return knownMap[subjectName];
  }

  // If subjectCode is short (<= 3 chars) and doesn't look like code with digits
  if (subjectCode && subjectCode.length <= 3 && !/\d/.test(subjectCode)) {
    return subjectCode.toUpperCase();
  }

  if (!subjectName) {
    return subjectCode ? subjectCode.slice(0, 3).toUpperCase() : "SUB";
  }

  // Fallback: generate abbreviation from subjectName
  const ignoredWords = new Set(["and", "of", "the", "&"]);
  const words = subjectName
    .split(/\s+/)
    .filter(w => w && !ignoredWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return subjectName.slice(0, 3).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // For 3+ words: first letters of first two important words
  return (words[0][0] + words[1][0]).toUpperCase();
};

const Attendance = () => {
  const { settings } = useUISettings();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: "", end: "" });
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" or "list"
  const [selectedMonth, setSelectedMonth] = useState("all");

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

  // Helper function to build attendance matrix
  const buildAttendanceMatrix = (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { dates: [], subjects: [], rows: [], subjectTotals: [], overallSummary: {} };
    }

    const dateMap = new Map();
    const subjectMap = new Map();
    const cellData = new Map(); // Key: "date-subjectId"

    attendanceRecords.forEach((record) => {
      const attendanceCount = Number(record.attendanceCount || record.periodCount || 1);
      const dateKey = new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
      const subjectId = record.subjectId?._id || "general";
      const subjectName = record.subjectId?.subjectName || "General Class";
      const subjectCode = record.subjectId?.subjectCode || "";

      // Track dates
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Date(record.date));
      }

      // Track subjects
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, { subjectId, subjectName, subjectCode });
      }

      // Track cell data
      const cellKey = `${dateKey}-${subjectId}`;
      if (!cellData.has(cellKey)) {
        cellData.set(cellKey, {
          totalUnits: 0,
          presentUnits: 0,
          absentUnits: 0,
          lateUnits: 0,
          leaveUnits: 0,
          records: [],
        });
      }

      const cell = cellData.get(cellKey);
      cell.totalUnits += attendanceCount;
      cell.records.push(record);

      if (record.studentStatus === "present") {
        cell.presentUnits += attendanceCount;
      } else if (record.studentStatus === "absent") {
        cell.absentUnits += attendanceCount;
      } else if (record.studentStatus === "late") {
        cell.lateUnits += attendanceCount;
      } else if (record.studentStatus === "leave") {
        cell.leaveUnits += attendanceCount;
      }
    });

    // Sort dates (newest to oldest) so recent attendance appears first
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([dateKey]) => dateKey);

    // Get subjects in order
    const subjects = Array.from(subjectMap.values());

    // Build matrix rows
    const rows = sortedDates.map((dateKey) => {
      const row = { date: dateKey, cells: [], dailyTotalUnits: 0, dailyPresentUnits: 0 };
      subjects.forEach((subject) => {
        const cellKey = `${dateKey}-${subject.subjectId}`;
        const cell = cellData.get(cellKey);
        let cellDisplay = { label: "NC", type: "nc" };

        if (cell) {
          const { totalUnits, presentUnits, absentUnits, lateUnits, leaveUnits } = cell;
          row.dailyTotalUnits += totalUnits;
          row.dailyPresentUnits += presentUnits;

          if (presentUnits === totalUnits) {
            cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "present" };
          } else if (presentUnits === 0) {
            if (absentUnits > 0 && lateUnits === 0 && leaveUnits === 0) {
              cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "absent" };
            } else if (lateUnits > 0 && absentUnits === 0 && leaveUnits === 0) {
              cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "late" };
            } else if (leaveUnits > 0 && absentUnits === 0 && lateUnits === 0) {
              cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "leave" };
            } else {
              cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "mixed" };
            }
          } else {
            cellDisplay = { label: `${presentUnits}/${totalUnits}`, type: "mixed" };
          }
        }

        row.cells.push({ subjectId: subject.subjectId, ...cellDisplay, records: cell?.records || [] });
      });

      // Daily total label
      if (row.dailyTotalUnits === 0) {
        row.dailyTotalLabel = "NC";
        row.dailyTotalType = "nc";
      } else if (row.dailyPresentUnits === row.dailyTotalUnits) {
        row.dailyTotalLabel = `${row.dailyPresentUnits}/${row.dailyTotalUnits}`;
        row.dailyTotalType = "present";
      } else if (row.dailyPresentUnits === 0) {
        row.dailyTotalLabel = `${row.dailyPresentUnits}/${row.dailyTotalUnits}`;
        row.dailyTotalType = "absent";
      } else {
        row.dailyTotalLabel = `${row.dailyPresentUnits}/${row.dailyTotalUnits}`;
        row.dailyTotalType = "mixed";
      }

      return row;
    });

    // Calculate subject totals
    const subjectTotals = subjects.map((subject) => {
      let totalUnits = 0;
      let presentUnits = 0;

      rows.forEach((row) => {
        const cell = row.cells.find((c) => c.subjectId === subject.subjectId);
        if (cell && cell.type !== "nc") {
          const [present, total] = cell.label.split("/").map(Number);
          totalUnits += total;
          presentUnits += present;
        }
      });

      let label = "NC";
      let type = "nc";
      let percentage = 0;

      if (totalUnits > 0) {
        label = `${presentUnits}/${totalUnits}`;
        percentage = (presentUnits / totalUnits) * 100;
        const subjectBand = getAttendanceBand(percentage, totalUnits, settings);
        type = subjectBand.key === "good" ? "present" : subjectBand.key === "warning" ? "mixed" : "absent";
      }

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        label,
        type,
        percentage
      };
    });

    // Overall summary
    let overallTotalUnits = 0;
    let overallPresentUnits = 0;
    rows.forEach((row) => {
      overallTotalUnits += row.dailyTotalUnits;
      overallPresentUnits += row.dailyPresentUnits;
    });

    const overallSummary = {
      totalUnits: overallTotalUnits,
      presentUnits: overallPresentUnits,
      percentage: overallTotalUnits > 0 ? (overallPresentUnits / overallTotalUnits) * 100 : 0,
    };

    return {
      dates: sortedDates,
      subjects,
      rows,
      subjectTotals,
      overallSummary,
    };
  };

  // Calculate subject-wise attendance using attendanceCount
  const subjectWiseAttendance = useMemo(() => {
    if (!report?.attendance) return [];

    const subjectMap = {};
    report.attendance.forEach((record) => {
      const subjectId = record.subjectId?._id || "general";
      const subjectName = record.subjectId?.subjectName || "General Class";
      const subjectCode = record.subjectId?.subjectCode || "";
      const attendanceCount = Number(record.attendanceCount || record.periodCount || 1);

      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          subjectId,
          subjectName,
          subjectCode,
          totalUnits: 0,
          presentUnits: 0,
          absentUnits: 0,
          lateUnits: 0,
          leaveUnits: 0,
        };
      }

      subjectMap[subjectId].totalUnits += attendanceCount;
      if (record.studentStatus === "present") subjectMap[subjectId].presentUnits += attendanceCount;
      else if (record.studentStatus === "absent") subjectMap[subjectId].absentUnits += attendanceCount;
      else if (record.studentStatus === "late") subjectMap[subjectId].lateUnits += attendanceCount;
      else if (record.studentStatus === "leave") subjectMap[subjectId].leaveUnits += attendanceCount;
    });

    return Object.values(subjectMap).map((subject) => ({
      ...subject,
      percentage: subject.totalUnits > 0 ? Math.round((subject.presentUnits / subject.totalUnits) * 100) : 0,
      status: getAttendanceBand((subject.presentUnits / Math.max(subject.totalUnits, 1)) * 100, subject.totalUnits, settings).key === "good" ? "safe" : "warning",
    }));
  }, [report?.attendance]);

  // Calculate monthly trend using attendanceCount
  const monthlyTrend = useMemo(() => {
    if (!report?.attendance) return [];

    const monthMap = {};
    report.attendance.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      const attendanceCount = Number(record.attendanceCount || record.periodCount || 1);

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, totalUnits: 0, presentUnits: 0 };
      }

      monthMap[monthKey].totalUnits += attendanceCount;
      if (record.studentStatus === "present") monthMap[monthKey].presentUnits += attendanceCount;
    });

    return Object.values(monthMap)
      .map((month) => ({
        ...month,
        percentage: month.totalUnits > 0 ? Math.round((month.presentUnits / month.totalUnits) * 100) : 0,
      }))
      .sort((a, b) => new Date(b.month) - new Date(a.month))
      .slice(0, 6);
  }, [report?.attendance]);

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    if (!report?.attendance) return [];
    const subjects = new Set();
    report.attendance.forEach((record) => {
      if (record.subjectId?._id) {
        subjects.add(record.subjectId._id);
      }
    });
    return Array.from(subjects);
  }, [report?.attendance]);

  // Get unique months for filter
  const uniqueMonths = useMemo(() => {
    if (!report?.attendance) return [];
    const months = new Set();
    report.attendance.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      months.add(monthKey);
    });
    return Array.from(months).sort((a, b) => new Date(b) - new Date(a));
  }, [report?.attendance]);

  // Build matrix data
  const matrixData = useMemo(() => {
    let filteredRecords = report?.attendance || [];

    // Filter by month
    if (selectedMonth !== "all") {
      filteredRecords = filteredRecords.filter((record) => {
        const date = new Date(record.date);
        const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
        return monthKey === selectedMonth;
      });
    }

    return buildAttendanceMatrix(filteredRecords);
  }, [report?.attendance, selectedMonth]);

  // Get cell color classes
  const getCellColorClasses = (type) => {
    switch (type) {
      case "present":
        return "bg-emerald-400/15 border-emerald-400/30 text-emerald-300 dark:bg-emerald-50 dark:border-emerald-200 dark:text-emerald-700";
      case "absent":
        return "bg-rose-400/15 border-rose-400/30 text-rose-300 dark:bg-rose-50 dark:border-rose-200 dark:text-rose-700";
      case "late":
        return "bg-amber-400/15 border-amber-400/30 text-amber-300 dark:bg-amber-50 dark:border-amber-200 dark:text-amber-700";
      case "leave":
        return "bg-sky-400/15 border-sky-400/30 text-sky-300 dark:bg-sky-50 dark:border-sky-200 dark:text-sky-700";
      case "mixed":
        return "bg-violet-400/15 border-violet-400/30 text-violet-300 dark:bg-violet-50 dark:border-violet-200 dark:text-violet-700";
      case "nc":
      default:
        return "bg-slate-700/50 border-slate-600/50 text-slate-400 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-500";
    }
  };

  if (loading) return <LoadingBlock message="Loading your attendance..." />;

  // Use matrix overall summary for calculations
  const overallSummary = matrixData.overallSummary;
  const overallPercentage = overallSummary.percentage || 0;
  const attendanceBand = getAttendanceBand(overallPercentage, overallSummary.totalUnits || 0, settings);
  const targetThreshold = attendanceBand.goodThreshold;
  const targetRatio = targetThreshold / 100;
  const presentUnits = Number(overallSummary.presentUnits || 0);
  const totalUnits = Number(overallSummary.totalUnits || 0);
  const unitsNeededForTarget =
    totalUnits > 0 && presentUnits / Math.max(totalUnits, 1) < targetRatio
      ? Math.max(0, Math.ceil((targetRatio * totalUnits - presentUnits) / (1 - targetRatio)))
      : 0;
  const attendanceTone = attendanceBand.key === "good"
    ? {
        message: `Good standing at ${attendanceBand.goodThreshold}%+`,
        panelLabel: "Good Standing",
        alertTitle: "",
      }
    : attendanceBand.key === "warning"
      ? {
          message: `Below minimum attendance (${attendanceBand.goodThreshold}% required)`,
          panelLabel: "Needs Attention",
          alertTitle: `Attendance Below ${attendanceBand.goodThreshold}%`,
        }
      : {
          message: `Critical attendance below ${attendanceBand.warningThreshold}%`,
          panelLabel: "Critical",
          alertTitle: `Attendance Below ${attendanceBand.warningThreshold}%`,
        };

  const getStatusDetails = (status) => {
    switch (status) {
      case "present":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
          icon: <FiCheckCircle className="text-emerald-500 shrink-0" />,
          label: "Present",
        };
      case "absent":
        return {
          bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
          icon: <FiXCircle className="text-red-500 shrink-0" />,
          label: "Absent",
        };
      case "late":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
          icon: <FiAlertCircle className="text-amber-500 shrink-0" />,
          label: "Late",
        };
      case "leave":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
          icon: <FiCalendar className="text-blue-500 shrink-0" />,
          label: "Leave",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
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

    const matchesSubject =
      subjectFilter === "all" || item.subjectId?._id === subjectFilter;

    const matchesDateRange =
      (!dateRangeFilter.start || new Date(item.date) >= new Date(dateRangeFilter.start)) &&
      (!dateRangeFilter.end || new Date(item.date) <= new Date(dateRangeFilter.end));

    return matchesSearch && matchesStatus && matchesSubject && matchesDateRange;
  });

  return (
    <section className="space-y-6 pb-28">
      <PageHeader
        eyebrow="Student"
        title="My Attendance"
        description="Track your subject-wise attendance register and period count."
      />
      <AlertMessage tone="error" message={errorMessage} />

      {report && (
        <>
          {/* Overall Attendance Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Overall Attendance</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Total Attendance Units: {overallSummary.totalUnits || 0}
                </p>
                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {overallPercentage.toFixed(1)}%
                    </span>
                    <span
                      className="mb-2 text-sm font-medium"
                      style={{ color: attendanceBand.toneColor }}
                    >
                      {attendanceTone.message}
                    </span>
                  </div>
                    <div className="mt-4 h-3 w-full max-w-md rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, overallPercentage)}%`, backgroundColor: attendanceBand.toneColor }}
                      ></div>
                    </div>
                    {unitsNeededForTarget > 0 ? (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Attend next <span className="font-semibold text-slate-900 dark:text-white">{unitsNeededForTarget}</span> class{unitsNeededForTarget > 1 ? "es" : ""} continuously to reach <span className="font-semibold text-slate-900 dark:text-white">{targetThreshold}%</span>.
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        You are currently meeting the <span className="font-semibold text-slate-900 dark:text-white">{targetThreshold}%</span> attendance target.
                      </p>
                    )}
                </div>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: withAlpha(attendanceBand.toneColor, 0.32),
                  backgroundColor: withAlpha(attendanceBand.toneColor, 0.12),
                }}
              >
                <div className="flex items-center gap-2">
                  {attendanceBand.key === "good" ? (
                    <FiCheckCircle className="h-5 w-5" style={{ color: attendanceBand.toneColor }} />
                  ) : attendanceBand.key === "warning" ? (
                    <FiTrendingUp className="h-5 w-5" style={{ color: attendanceBand.toneColor }} />
                  ) : (
                    <FiAlertCircle className="h-5 w-5" style={{ color: attendanceBand.toneColor }} />
                  )}
                  <span className="text-sm font-semibold" style={{ color: attendanceBand.toneColor }}>
                    {attendanceTone.panelLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Low Attendance Alert */}
          {attendanceBand.key !== "good" && (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: withAlpha(attendanceBand.toneColor, 0.28),
                backgroundColor: withAlpha(attendanceBand.toneColor, 0.12),
              }}
            >
              <div className="flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: attendanceBand.toneColor }} />
                <div>
                  <p className="font-semibold" style={{ color: attendanceBand.toneColor }}>{attendanceTone.alertTitle}</p>
                  <p className="mt-1 text-sm" style={{ color: attendanceBand.toneColor }}>
                    {attendanceBand.key === "warning"
                      ? `Your attendance is below ${attendanceBand.goodThreshold}%. Please attend upcoming classes regularly to return to the safe range.`
                      : `Your attendance is below ${attendanceBand.warningThreshold}%. Please attend upcoming classes regularly to avoid critical shortage.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Present Units Card */}
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Present Units</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">{overallSummary.presentUnits || 0}</p>
                </div>
              </div>
            </div>

            {/* Absent Units Card */}
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-5 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <FiXCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Absent Units</p>
                  <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-300 tabular-nums">{subjectWiseAttendance.reduce((sum, s) => sum + (s.absentUnits || 0), 0)}</p>
                </div>
              </div>
            </div>

            {/* Total Subjects Card */}
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-5 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <FiBookOpen className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Total Subjects</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">{subjectWiseAttendance.length}</p>
                </div>
              </div>
            </div>

            {/* Total Units Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-5 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  <FiTrendingUp className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">Total Units</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-200 tabular-nums">{overallSummary.totalUnits || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Attendance */}
          {subjectWiseAttendance.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Subject-wise Attendance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Units</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Present Units</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Absent Units</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Late Units</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Leave Units</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">%</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectWiseAttendance.map((subject) => (
                      <tr key={subject.subjectId} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{subject.subjectName}</p>
                            {subject.subjectCode && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{subject.subjectCode}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-slate-700 dark:text-slate-300 tabular-nums">{subject.totalUnits}</td>
                        <td className="text-center py-3 px-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{subject.presentUnits}</td>
                        <td className="text-center py-3 px-4 text-sm text-red-600 dark:text-red-400 font-medium tabular-nums">{subject.absentUnits}</td>
                        <td className="text-center py-3 px-4 text-sm text-amber-600 dark:text-amber-400 font-medium tabular-nums">{subject.lateUnits}</td>
                        <td className="text-center py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium tabular-nums">{subject.leaveUnits}</td>
                        <td className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{subject.percentage}%</td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${subject.status === "safe"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                          >
                            {subject.status === "safe" ? "Safe" : "Warning"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Attendance Trend */}
          {monthlyTrend.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Monthly Attendance Trend</h2>
              <div className="space-y-4">
                {monthlyTrend.map((month) => (
                  <div key={month.month}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{month.month}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{month.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${month.percentage}%`,
                          backgroundColor: getAttendanceBand(month.percentage, 1, settings).toneColor,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Matrix / List View */}
          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attendance Register</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {selectedMonth === "all" ? "All Time Attendance" : `${selectedMonth} Attendance Register`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("matrix")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "matrix"
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                      }`}
                  >
                    <FiTable className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "list"
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                      }`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>

                {/* Month Filter */}
                {uniqueMonths.length > 0 && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm outline-none dark:text-white"
                  >
                    <option value="all">All Months</option>
                    {uniqueMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Legend */}
            {viewMode === "matrix" && (
              <div className="flex flex-wrap items-center gap-2.5 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-400/15 border border-emerald-400/30 dark:bg-emerald-50 dark:border-emerald-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-rose-400/15 border border-rose-400/30 dark:bg-rose-50 dark:border-rose-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-amber-400/15 border border-amber-400/30 dark:bg-amber-50 dark:border-amber-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-violet-400/15 border border-violet-400/30 dark:bg-violet-50 dark:border-violet-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mixed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-sky-400/15 border border-sky-400/30 dark:bg-sky-50 dark:border-sky-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-slate-700/50 border border-slate-600/50 dark:bg-slate-100 dark:border-slate-200"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">No Class</span>
                </div>
              </div>
            )}

            {/* Matrix View */}
            {viewMode === "matrix" && (
              <>
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Swipe left/right to view all subjects</span>
                  <FiArrowRight className="h-3.5 w-3.5 shrink-0" />
                </div>
                <div className="relative isolate max-w-full overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800 no-scrollbar scroll-smooth">
                  {matrixData.rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FiGrid className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="font-semibold text-slate-500 dark:text-slate-400">No attendance records found</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Your attendance register will appear here once teachers mark attendance.
                      </p>
                    </div>
                  ) : (() => {
                    const subjectCount = matrixData.subjects.length;
                    const isDenseMode = subjectCount > 12;
                    const dateWidthClass = "w-[112px] min-w-[112px] max-w-[112px]";
                    const subjectWidthClass = isDenseMode ? "w-[40px] min-w-[40px] max-w-[40px] sm:w-[46px] sm:min-w-[46px] sm:max-w-[46px]" : "w-[44px] min-w-[44px] max-w-[44px] sm:w-[52px] sm:min-w-[52px] sm:max-w-[52px]";
                    const dailyTotalWidthClass = "w-[88px] min-w-[88px] max-w-[88px]";
                    const subjectColumnWidth = isDenseMode ? 46 : 52;
                    const minTableWidth = 112 + 88 + (subjectCount * subjectColumnWidth);
                    const cellClass = isDenseMode ? "attendance-matrix-cell-dense" : "attendance-matrix-cell";
                    
                    return (
                      <table className="w-max min-w-[720px] border-collapse table-fixed" style={{ minWidth: `${Math.max(720, minTableWidth)}px` }}>
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className={`bg-white text-left py-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${dateWidthClass} border-r border-slate-200/80 dark:border-slate-700/70`}>Date</th>
                          {matrixData.subjects.map((subject) => (
                            <th
                              key={subject.subjectId}
                              className={`text-center py-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${subjectWidthClass} border-r border-slate-200/70 dark:border-slate-700/40`}
                              title={subject.subjectCode ? `${subject.subjectName} (${subject.subjectCode})` : subject.subjectName}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] leading-tight select-none">
                                  {getSubjectAbbreviation(subject.subjectName, subject.subjectCode, subject.shortName)}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className={`bg-slate-50 text-center py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-200 sm:text-[11px] ${dailyTotalWidthClass} border-l-2 border-slate-300 dark:border-slate-600`}>Daily Total</th>
                        </tr>
                      </thead>
                      <tbody>
                          {matrixData.rows.map((row) => (
                          <tr key={row.date} className="border-b border-slate-100 dark:border-slate-700">
                            <td className={`bg-white py-2 px-2.5 text-xs font-medium text-slate-900 whitespace-nowrap dark:bg-slate-800 dark:text-slate-100 ${dateWidthClass} border-r border-slate-200/80 dark:border-slate-700/70`}>
                              {row.date}
                            </td>
                            {row.cells.map((cell) => (
                              <td key={cell.subjectId} className={`py-2 px-1 text-center border-r border-slate-200/70 dark:border-slate-700/40 ${subjectWidthClass}`}>
                                <div
                                  className={`${cellClass} mx-auto ${getCellColorClasses(cell.type)}`}
                                  title={
                                    cell.records.length > 0
                                      ? cell.records.map((r) => {
                                          const subjectName = r.subjectId?.subjectName || 'General Class';
                                          const subjectCode = r.subjectId?.subjectCode || '';
                                          const status = r.studentStatus || 'Unknown';
                                          const count = r.attendanceCount || 1;
                                          const time = r.startTime ? `${r.startTime}${r.endTime ? ' - ' + r.endTime : ''}` : '';
                                          return `${subjectName}${subjectCode ? ` (${subjectCode})` : ''}\nDate: ${row.date}\nStatus: ${status}\nAttendance: ${count} period${count > 1 ? 's' : ''}${time ? `\nTime: ${time}` : ''}`;
                                        }).join('\n\n')
                                      : "No Class Scheduled"
                                  }
                                >
                                  {cell.label}
                                </div>
                              </td>
                            ))}
                            <td className={`bg-slate-50 py-2 px-1 text-center dark:bg-slate-700 border-l-2 border-slate-300 dark:border-slate-600 ${dailyTotalWidthClass}`}>
                              <div
                                className={`${cellClass} mx-auto ${getCellColorClasses(row.dailyTotalType)}`}
                              >
                                {row.dailyTotalLabel}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Subject Totals Row */}
                        <tr className="border-t-2 border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-700/50">
                          <td className={`bg-slate-100 py-2 px-2.5 text-xs font-bold text-slate-900 whitespace-nowrap dark:bg-slate-700 dark:text-slate-100 ${dateWidthClass} border-r border-slate-200/80 dark:border-slate-700/70`}>
                            Total
                          </td>
                          {matrixData.subjectTotals.map((total) => (
                            <td key={total.subjectId} className={`py-2 px-1 text-center border-r border-slate-200/70 dark:border-slate-700/40 ${subjectWidthClass}`}>
                              <div
                                className={`${cellClass} mx-auto ${getCellColorClasses(total.type)}`}
                                title={`${total.subjectName || "General Class"}${total.subjectCode ? ` (${total.subjectCode})` : ""} - Total Attendance`}
                              >
                                {total.label}
                              </div>
                            </td>
                          ))}
                          <td className={`bg-slate-200 py-2 px-1 text-center dark:bg-slate-600 border-l-2 border-slate-300 dark:border-slate-600 ${dailyTotalWidthClass}`}>
                            <div
                              className={`${cellClass} mx-auto ${getCellColorClasses(
                                attendanceBand.key === "good" ? "present" : attendanceBand.key === "warning" ? "mixed" : "absent"
                              )}`}
                              title={`Overall Attendance Total: ${overallSummary.presentUnits}/${overallSummary.totalUnits} (${overallPercentage.toFixed(1)}%)`}
                            >
                              {overallSummary.presentUnits}/{overallSummary.totalUnits}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      </table>
                    );
                  })()}
                </div>
              </>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="overflow-x-auto">
                {filteredAttendance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FiGrid className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-500 dark:text-slate-400">No attendance records found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {report.attendance?.length === 0
                        ? "Your attendance will appear here once teachers start marking attendance."
                        : "Try resetting your search query or filter options."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance Count</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marked By</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((item) => {
                          const status = getStatusDetails(item.studentStatus);
                          return (
                            <tr
                              key={item._id}
                              className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FiCalendar className="text-slate-400 w-4 h-4" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{formatDateString(item.date)}</span>
                                </div>
                                {item.startTime && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <FiClock className="text-slate-400 w-3 h-3" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {item.startTime} {item.endTime ? `- ${item.endTime}` : ""}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <FiBookOpen className="text-indigo-500 w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {item.subjectId?.subjectName || "General Class"}
                                    </span>
                                  </div>
                                  {item.subjectId?.subjectCode && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.subjectId.subjectCode}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${status.bg}`}
                                >
                                  {status.icon}
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                {item.attendanceCount || 1}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                                {item.markedBy?.name || "Teacher"}
                              </td>
                              <td className="py-3 px-4">
                                {item.studentRemarks ? (
                                  <span className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                    {item.studentRemarks}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Attendance;
