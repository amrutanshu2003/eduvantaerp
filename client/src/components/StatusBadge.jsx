import { useUISettings } from "../context/UISettingsContext";

const badgeMap = {
  active: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  inactive: { light: "bg-slate-200 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  maintenance: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  available: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  full: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  occupied: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  left: { light: "bg-slate-200 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  cancelled: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  pending: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  approved: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  rejected: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  parent_approved: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-500/20 text-cyan-400" },
  not_required: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  open: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  in_progress: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  resolved: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  closed: { light: "bg-slate-200 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  free: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  basic: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  premium: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  paid: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  unpaid: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  trial: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-500/20 text-violet-400" },
  expired: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-500/20 text-orange-400" },
  partial: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  overdue: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  school: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-500/20 text-cyan-400" },
  college: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-500/20 text-indigo-400" },
  university: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-500/20 text-violet-400" },
  boys: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  girls: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  "co ed": { light: "bg-violet-100 text-violet-700", dark: "bg-violet-500/20 text-violet-400" },
  co_ed: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-500/20 text-violet-400" },
  draft: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  published: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  archived: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  general: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  academic: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  exam: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-500/20 text-indigo-400" },
  fees: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  holiday: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  event: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-500/20 text-cyan-400" },
  emergency: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  low: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  normal: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  high: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-500/20 text-amber-400" },
  urgent: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-500/20 text-rose-400" },
  all: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" },
  admins: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-500/20 text-indigo-400" },
  teachers: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-500/20 text-sky-400" },
  students: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-500/20 text-emerald-400" },
  parents: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-500/20 text-cyan-400" },
  staff: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-500/20 text-orange-400" },
  "academic group": { light: "bg-violet-100 text-violet-700", dark: "bg-violet-500/20 text-violet-400" },
};

const StatusBadge = ({ value }) => {
  const { resolvedTheme } = useUISettings();
  const isDark = resolvedTheme === "dark";
  const normalizedValue = String(value || "").toLowerCase();
  const badgeStyle = badgeMap[normalizedValue] || { light: "bg-slate-100 text-slate-700", dark: "bg-slate-500/20 text-slate-400" };
  const className = isDark ? badgeStyle.dark : badgeStyle.light;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}>
      {String(value || "").replace("_", " ")}
    </span>
  );
};

export default StatusBadge;
