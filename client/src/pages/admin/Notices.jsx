import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";
import { noticeAudienceOptions, noticePriorityOptions, noticeStatusOptions, noticeTypeOptions } from "../../utils/noticeOptions";

const Notices = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [notices, setNotices] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    audience: "all",
    priority: "all",
    noticeType: "all",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

  const fetchNotices = async () => {
    try {
      const { data } = await api.get("/notices", { params: filters });
      setNotices(data.notices);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [filters.status, filters.audience, filters.priority, filters.noticeType]);

  const filteredNotices = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return notices;

    return notices.filter(
      (notice) =>
        notice.title?.toLowerCase().includes(search) ||
        notice.description?.toLowerCase().includes(search)
    );
  }, [notices, filters.search]);

  const handleStatusUpdate = async (notice) => {
    const nextStatus = notice.status === "published" ? "archived" : "published";
    setConfirmModal({
      type: "status",
      notice,
      title: `${nextStatus === "published" ? "Publish" : "Archive"} Notice?`,
      message: nextStatus === "published" 
        ? "This notice will be visible to the target audience." 
        : "This notice will be archived and no longer visible.",
    });
  };

  const confirmStatusUpdate = async () => {
    if (!confirmModal) return;
    const { notice } = confirmModal;
    const nextStatus = notice.status === "published" ? "archived" : "published";
    try {
      setActionLoading(true);
      const { data } = await api.patch(`/notices/${notice._id}/status`, { status: nextStatus });
      setNotices((current) => current.map((n) => (n._id === notice._id ? data.notice : n)));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update notice status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notice) => {
    setConfirmModal({
      type: "delete",
      notice,
      title: "Delete Notice?",
      message: "This action will remove the notice record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { notice } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/notices/${notice._id}`);
      setNotices((current) => current.filter((n) => n._id !== notice._id));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete notice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      audience: "all",
      priority: "all",
      noticeType: "all",
    });
  };

  if (loading) return <LoadingBlock message="Loading notices..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Notice Board"
        description="Create, filter, publish, archive, and review institute notices."
        actions={
          <Link
            to="/admin/notices/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Notice
          </Link>
        }
      />

      <FilterBar
        filters={filters}
        onFilterChange={(event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSearch={() => {}}
        onReset={handleResetFilters}
        searchPlaceholder="Search notices"
      >
        <input
          name="search"
          placeholder="Search notices"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select name="status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Status</option>
          {noticeStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="audience" value={filters.audience} onChange={(event) => setFilters((current) => ({ ...current, audience: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Audience</option>
          {noticeAudienceOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="priority" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Priority</option>
          {noticePriorityOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="noticeType" value={filters.noticeType} onChange={(event) => setFilters((current) => ({ ...current, noticeType: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Types</option>
          {noticeTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </FilterBar>

      <AlertMessage tone="error" message={errorMessage} />

      {filteredNotices.length === 0 ? (
        <EmptyState
          title="No notices found"
          description="Create school announcements and notices or adjust filters to view current alerts."
          actionText="Create Notice"
          actionLink="/admin/notices/create"
        />
      ) : (
        <TableShell
          headers={["Notice", "Audience", "Priority", "Status", "Publish Date", "Actions"]}
        >
          {filteredNotices.map((notice) => (
            <tr key={notice._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{notice.title}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{formatLabel(notice.noticeType)}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={notice.audience} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={notice.priority} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={notice.status} />
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatDate(notice.publishDate)}</p>
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={notice}
                  isActive={notice.status === "published"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={notice.status === "published" ? () => handleStatusUpdate(notice) : undefined}
                  onActivate={notice.status === "archived" ? () => handleStatusUpdate(notice) : undefined}
                  onDelete={() => handleDelete(notice)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "delete" ? confirmDelete : confirmStatusUpdate}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.notice?.status === "published" ? "Archive" : "Publish"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Notices;
