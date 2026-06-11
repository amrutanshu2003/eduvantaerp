import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";
import { noticeAudienceOptions, noticePriorityOptions, noticeStatusOptions, noticeTypeOptions } from "../../utils/noticeOptions";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const Notices = () => {
  const { settings, getButtonRadius } = useUISettings();
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

  const handleStatusUpdate = async (noticeId, status) => {
    try {
      const { data } = await api.patch(`/notices/${noticeId}/status`, { status });
      setNotices((current) => current.map((notice) => (notice._id === noticeId ? data.notice : notice)));
      window.alert(`Notice marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update notice status");
    }
  };

  const handleDelete = async (noticeId) => {
    if (!(await window.confirm("Delete this notice?"))) return;

    try {
      await api.delete(`/notices/${noticeId}`);
      setNotices((current) => current.filter((notice) => notice._id !== noticeId));
      window.alert("Notice deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete notice");
    }
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

      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-5">
        <input
          placeholder="Search notices"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className={filterClass}
        />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          {noticeStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.audience} onChange={(event) => setFilters((current) => ({ ...current, audience: event.target.value }))} className={filterClass}>
          <option value="all">All Audience</option>
          {noticeAudienceOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} className={filterClass}>
          <option value="all">All Priority</option>
          {noticePriorityOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.noticeType} onChange={(event) => setFilters((current) => ({ ...current, noticeType: event.target.value }))} className={filterClass}>
          <option value="all">All Types</option>
          {noticeTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </div>

      <AlertMessage tone="error" message={errorMessage} />

      {filteredNotices.length === 0 ? (
        <EmptyState
          title="No notices found"
          description="Create school announcements and notices or adjust filters to view current alerts."
          actionText="Create Notice"
          actionLink="/admin/notices/create"
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Notice</th>
                  <th className="px-6 py-4 font-medium">Audience</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Publish Date</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((notice) => (
                  <tr key={notice._id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{notice.title}</p>
                      <p className="text-xs text-slate-500">{formatLabel(notice.noticeType)}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge value={notice.audience} /></td>
                    <td className="px-6 py-4"><StatusBadge value={notice.priority} /></td>
                    <td className="px-6 py-4"><StatusBadge value={notice.status} /></td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(notice.publishDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/notices/${notice._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                        <Link to={`/admin/notices/${notice._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                        <button type="button" onClick={() => handleStatusUpdate(notice._id, notice.status === "published" ? "archived" : "published")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          {notice.status === "published" ? "Archive" : "Publish"}
                        </button>
                        <button type="button" onClick={() => handleDelete(notice._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
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

export default Notices;
