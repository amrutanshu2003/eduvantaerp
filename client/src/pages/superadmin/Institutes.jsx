import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import StatCard, { StatCardSkeleton } from "../../components/StatCard";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal, Input, Select } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";
import { FiHome, FiCheckSquare, FiBookOpen, FiLayers, FiUsers, FiClock, FiPlus } from "react-icons/fi";

const filterDefaults = {
  search: "",
  status: "all",
  instituteType: "all",
  plan: "all",
};

const getIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes("total institutes")) return FiHome;
  if (l.includes("active")) return FiCheckSquare;
  if (l.includes("school")) return FiBookOpen;
  if (l.includes("college")) return FiLayers;
  if (l.includes("university")) return FiBookOpen;
  if (l.includes("admin")) return FiUsers;
  if (l.includes("trial") || l.includes("expired")) return FiClock;
  return FiHome;
};

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

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Institutes = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [filters, setFilters] = useState(filterDefaults);
  const [institutes, setInstitutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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
    setConfirmModal({
      type: "status",
      institute,
      title: institute.status === "active" ? "Deactivate Institute?" : "Activate Institute?",
      message: institute.status === "active" 
        ? "This institute will no longer be able to login." 
        : "This institute will be able to login again.",
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { institute } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = institute.status === "active" ? "inactive" : "active";
      await api.patch(`/institutes/${institute._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Institute marked as ${nextStatus}`);
      setConfirmModal(null);
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (institute) => {
    setConfirmModal({
      type: "delete",
      institute,
      title: `Delete ${institute.name}?`,
      message: "This will soft delete the institute. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { institute } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/institutes/${institute._id}`);
      setMessageTone("success");
      setMessage("Institute deleted successfully");
      setConfirmModal(null);
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete institute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(filterDefaults);
    fetchInstitutes();
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
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-lg hover:shadow-teal-500/10 active:scale-95"
          >
            <FiPlus className="h-5 w-5" />
            <span>Create Institute</span>
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
          : statCards.map((item, i) => {
              const Icon = getIcon(item.label);
              return (
                <StatCard
                  key={item.label}
                  color={CARD_COLORS[i % CARD_COLORS.length]}
                  to={CARD_ROUTES[i]}
                  icon={Icon}
                  {...item}
                />
              );
            })}
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        searchPlaceholder="Search by name, code, email..."
      >
        <Input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, code, email..."
        />
        <Select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          name="instituteType"
          value={filters.instituteType}
          onChange={handleFilterChange}
        >
          <option value="all">All Types</option>
          <option value="school">School</option>
          <option value="college">College</option>
          <option value="university">University</option>
        </Select>
        <Select
          name="plan"
          value={filters.plan}
          onChange={handleFilterChange}
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </Select>
      </FilterBar>

      {institutes.length === 0 ? (
        <EmptyState
          title="No institutes found"
          description="No institutes found. Create your first institute to get started."
          actionText="Create Institute"
          actionLink="/super-admin/institutes/create"
        />
      ) : (
        <TableShell
          headers={["Institute", "Type", "Status", "Plan", "Payment", "Actions"]}
        >
          {institutes.map((institute) => (
            <tr key={institute._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(institute.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{institute.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{institute.instituteCode} • {institute.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={institute.instituteType} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={institute.status} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={institute.plan} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={institute.paymentStatus} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={institute}
                  isActive={institute.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={institute.status === "active" ? () => handleStatusToggle(institute) : undefined}
                  onActivate={institute.status === "inactive" ? () => handleStatusToggle(institute) : undefined}
                  onDelete={() => handleDelete(institute)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "delete" ? confirmDelete : confirmStatusToggle}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.institute?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Institutes;
