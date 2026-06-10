const badgeMap = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-700",
  maintenance: "bg-amber-100 text-amber-700",
  available: "bg-emerald-100 text-emerald-700",
  full: "bg-rose-100 text-rose-700",
  occupied: "bg-sky-100 text-sky-700",
  left: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  parent_approved: "bg-cyan-100 text-cyan-700",
  not_required: "bg-slate-100 text-slate-700",
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-sky-100 text-sky-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-700",
  free: "bg-slate-100 text-slate-700",
  basic: "bg-sky-100 text-sky-700",
  premium: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-rose-100 text-rose-700",
  trial: "bg-violet-100 text-violet-700",
  expired: "bg-orange-100 text-orange-700",
  partial: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
  school: "bg-cyan-100 text-cyan-700",
  college: "bg-indigo-100 text-indigo-700",
  university: "bg-violet-100 text-violet-700",
  boys: "bg-sky-100 text-sky-700",
  girls: "bg-rose-100 text-rose-700",
  "co ed": "bg-violet-100 text-violet-700",
  co_ed: "bg-violet-100 text-violet-700",
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-amber-100 text-amber-700",
  general: "bg-slate-100 text-slate-700",
  academic: "bg-sky-100 text-sky-700",
  exam: "bg-indigo-100 text-indigo-700",
  fees: "bg-amber-100 text-amber-700",
  holiday: "bg-emerald-100 text-emerald-700",
  event: "bg-cyan-100 text-cyan-700",
  emergency: "bg-rose-100 text-rose-700",
  low: "bg-slate-100 text-slate-700",
  normal: "bg-sky-100 text-sky-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-rose-100 text-rose-700",
  all: "bg-slate-100 text-slate-700",
  admins: "bg-indigo-100 text-indigo-700",
  teachers: "bg-sky-100 text-sky-700",
  students: "bg-emerald-100 text-emerald-700",
  parents: "bg-cyan-100 text-cyan-700",
  staff: "bg-orange-100 text-orange-700",
  "academic group": "bg-violet-100 text-violet-700",
};

const StatusBadge = ({ value }) => {
  const normalizedValue = String(value || "").toLowerCase();
  const className = badgeMap[normalizedValue] || "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}>
      {String(value || "").replace("_", " ")}
    </span>
  );
};

export default StatusBadge;
