import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

const UserLibraryPage = ({ role, childMode = false }) => {
  const { studentId } = useParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const endpoint = childMode ? `/library/issues/child/${studentId}` : "/library/issues/my-books";
        const { data } = await api.get(endpoint);
        setIssues(data.issues || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load library records");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, [childMode, studentId]);

  if (loading) return <LoadingBlock message="Loading library records..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={role} title={childMode ? "Child Library" : "My Library"} description={childMode ? "Review linked child issued, overdue, and returned books." : "Review your issued books, due dates, and fine amounts."} />
      <AlertMessage tone="error" message={errorMessage} />
      {issues.length === 0 ? <EmptyState title="No library records found" description="Issued and returned book history will appear here." /> : <div className="grid gap-4">{issues.map((issue) => <div key={issue._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{issue.bookId?.title || "Library Book"}</h3><p className="mt-2 text-sm text-slate-600">{issue.bookId?.author || "-"} • Due {formatDate(issue.dueDate)}</p></div><StatusBadge value={issue.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Issue Date</p><p className="mt-2 font-semibold text-ink">{formatDate(issue.issueDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Return Date</p><p className="mt-2 font-semibold text-ink">{formatDate(issue.returnDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fine</p><p className="mt-2 font-semibold text-ink">{formatCurrency(issue.fineAmount)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Remarks</p><p className="mt-2 font-semibold text-ink">{issue.remarks || "-"}</p></div></div></div>)}</div>}
    </section>
  );
};

export default UserLibraryPage;
