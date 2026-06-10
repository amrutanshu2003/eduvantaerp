import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";

const NoticeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadNotice = async () => {
      try {
        const { data } = await api.get(`/notices/${id}`);
        setNotice(data.notice);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load notice");
      } finally {
        setLoading(false);
      }
    };

    loadNotice();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      const { data } = await api.patch(`/notices/${id}/status`, { status });
      setNotice(data.notice);
      window.alert(`Notice marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update status");
    }
  };

  const handleDelete = async () => {
    if (!(await window.confirm("Delete this notice?"))) return;

    try {
      await api.delete(`/notices/${id}`);
      window.alert("Notice deleted successfully");
      navigate("/admin/notices");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete notice");
    }
  };

  if (loading) return <LoadingBlock message="Loading notice details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={notice?.title || "Notice Details"}
        description="Review the full notice content and manage publication status."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/admin/notices/${id}/edit`}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Edit Notice
            </Link>
            <button type="button" onClick={handleDelete} className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">
              Delete
            </button>
          </div>
        }
      />

      <AlertMessage tone="error" message={errorMessage} />

      {notice ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={notice.status} />
            <StatusBadge value={notice.priority} />
            <StatusBadge value={notice.noticeType} />
            <StatusBadge value={notice.audience} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Publish Date</p><p className="mt-2 font-semibold text-ink">{formatDate(notice.publishDate)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expiry Date</p><p className="mt-2 font-semibold text-ink">{formatDate(notice.expiryDate)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{notice.academicGroupId?.className || formatLabel(notice.academicGroupId?.course || "") || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated By</p><p className="mt-2 font-semibold text-ink">{notice.updatedBy?.name || "-"}</p></div>
          </div>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <p className="text-sm leading-7 text-slate-700">{notice.description}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => handleStatusUpdate("draft")} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Mark Draft</button>
            <button type="button" onClick={() => handleStatusUpdate("published")} className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">Publish</button>
            <button type="button" onClick={() => handleStatusUpdate("archived")} className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700">Archive</button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default NoticeDetails;
