import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const filterDefaults = {
  search: "",
  status: "all",
  instituteType: "all",
  plan: "all",
};

// Colorful stat card (matches dashboard style)
const StatCard = ({ label, value, detail, color, to }) => (
  <Link
    to={to}
    className={`${color} rounded-[1.75rem] p-6 shadow-card transition hover:opacity-90 hover:scale-105`}
  >
    <p className="text-sm uppercase tracking-[0.25em] text-white/80">{label}</p>
    <h3 className="mt-4 text-4xl font-semibold text-white">{value}</h3>
    <p className="mt-3 text-sm text-white/70">{detail}</p>
  </Link>
);

const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
    <div className="skeleton-block h-3 w-24 rounded-full" />
    <div className="skeleton-block mt-5 h-9 w-16 rounded-xl" />
    <div className="skeleton-block mt-3 h-3 w-40 rounded-full" />
  </div>
);

const CARD_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500",
  "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500",
];

const CARD_ROUTES = [
  "/super-admin/institutes", "/super-admin/institutes", "/super-admin/institutes",
  "/super-admin/institutes", "/super-admin/institutes", "/super-admin/admins",
  "/super-admin/institutes",
];

const SKELETON_LABELS = [
  "Total Institutes", "Active Institutes", "Schools",
  "Colleges", "Universities", "Total Admins", "Trial / Expired",
];

const Institutes = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [filters, setFilters] = useState(filterDefaults);
  const [institutes, setInstitutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/institutes", { params: filters });
      setInstitutes(data.institutes);
      setStats(data.stats);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load institutes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await fetchInstitutes();
  };

  const handleStatusToggle = async (institute) => {
    try {
      const nextStatus = institute.status === "active" ? "inactive" : "active";
      await api.patch(`/institutes/${institute._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Institute marked as ${nextStatus}`);
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    }
  };

  const handleDelete = async (institute) => {
    if (!(await window.confirm(`Delete ${institute.name}? This will soft delete the institute.`))) {
      return;
    }

    try {
      await api.delete(`/institutes/${institute._id}`);
      setMessageTone("success");
      setMessage("Institute deleted successfully");
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete institute");
    }
  };

  const statCards = useMemo(
    () =>
      stats
        ? [
            { label: "Total Institutes", value: stats.totalInstitutes, detail: "All active records in the ERP" },
            { label: "Active Institutes", value: stats.activeInstitutes, detail: "Institutes currently enabled" },
            { label: "Schools", value: stats.schoolCount, detail: "School-type institutes" },
            { label: "Colleges", value: stats.collegeCount, detail: "College-type institutes" },
            { label: "Universities", value: stats.universityCount, detail: "University-type institutes" },
            { label: "Total Admins", value: stats.totalAdmins, detail: "Institute admin accounts" },
            { label: "Trial / Expired", value: stats.trialExpiredInstitutes, detail: "Follow-up subscription targets" },
          ]
        : [],
    [stats]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Institute Management"
        description="Create, search, update and manage institutes along with quick subscription visibility."
        actions={
          <Link
            to="/super-admin/institutes/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Institute
          </Link>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {/* Colorful stat cards — show skeleton while loading */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? SKELETON_LABELS.map((label, i) => (
              <StatCardSkeleton key={label} />
            ))
          : statCards.map((item, i) => (
              <StatCard
                key={item.label}
                color={CARD_COLORS[i % CARD_COLORS.length]}
                to={CARD_ROUTES[i]}
                {...item}
              />
            ))}
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, code, email..."
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          name="instituteType"
          value={filters.instituteType}
          onChange={handleFilterChange}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        >
          <option value="all">All Types</option>
          <option value="school">School</option>
          <option value="college">College</option>
          <option value="university">University</option>
        </select>
        <div className="flex gap-3">
          <select name="plan" value={filters.plan} onChange={handleFilterChange} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          <button
            type="submit"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>
      </form>

      {!loading && institutes.length === 0 ? (
        <EmptyState title="No institutes found" description="Create your first institute or adjust the filters." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Institute</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 rounded-full bg-slate-100 animate-pulse" style={{ width: j === 0 ? "8rem" : "4rem" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : institutes.map((institute) => (
                      <tr key={institute._id} className="border-t border-slate-100">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-ink">{institute.name}</p>
                            <p className="text-xs text-slate-500">{institute.instituteCode} • {institute.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge value={institute.instituteType} /></td>
                        <td className="px-6 py-4"><StatusBadge value={institute.status} /></td>
                        <td className="px-6 py-4"><StatusBadge value={institute.plan} /></td>
                        <td className="px-6 py-4"><StatusBadge value={institute.paymentStatus} /></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/super-admin/institutes/${institute._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                              View
                            </Link>
                            <Link to={`/super-admin/institutes/${institute._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(institute)}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              {institute.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(institute)}
                              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default Institutes;
