import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatCurrency, formatDate } from "../../utils/formatters";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageIssuesPage = ({ basePath, eyebrow, title, description, overdueOnly = false, studentHistory = false }) => {
  const { studentId } = useParams();
  const { settings, getButtonRadius } = useUISettings();
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ studentId: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const issueEndpoint = studentHistory
          ? `/library/issues/student/${studentId}`
          : overdueOnly
            ? "/library/issues/overdue"
            : "/library/issues";
        const [issueResponse, studentResponse] = await Promise.all([
          api.get(issueEndpoint, { params: studentHistory ? undefined : filters }),
          studentHistory ? Promise.resolve({ data: { students: [] } }) : api.get("/students"),
        ]);
        setIssues(issueResponse.data.issues || []);
        setStudents(studentResponse.data.students || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load book issues");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters.studentId, filters.status, overdueOnly, studentHistory, studentId]);

  const handleReturn = async (issueId) => {
    try {
      const { data } = await api.patch(`/library/issues/${issueId}/return`, {});
      setIssues((current) => current.map((issue) => (issue._id === issueId ? data.issue : issue)));
      window.alert("Book returned successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to return book");
    }
  };

  const handleFine = async (issueId, currentFine) => {
    const fineAmount = window.prompt("Enter fine amount", currentFine ?? 0);
    if (fineAmount === null) return;
    try {
      const { data } = await api.patch(`/library/issues/${issueId}/fine`, { fineAmount });
      setIssues((current) => current.map((issue) => (issue._id === issueId ? data.issue : issue)));
      window.alert("Fine updated successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update fine");
    }
  };

  if (loading) return <LoadingBlock message="Loading book issues..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={!overdueOnly && !studentHistory ? <Link to={`${basePath}/issues/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Issue Book</Link> : null} />
      {!studentHistory ? <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-2"><select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className={filterClass}><option value="all">All Students</option>{students.map((student) => <option key={student._id} value={student._id}>{student.name}</option>)}</select><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="all">All Status</option><option value="issued">Issued</option><option value="returned">Returned</option><option value="overdue">Overdue</option><option value="lost">Lost</option></select></div> : null}
      <AlertMessage tone="error" message={errorMessage} />
      {issues.length === 0 ? <EmptyState title="No book issues found" description="Issued and returned book records will appear here." /> : <div className="grid gap-4">{issues.map((issue) => <div key={issue._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{issue.bookId?.title || "Book Issue"}</h3><p className="mt-2 text-sm text-slate-600">{issue.studentId?.userId?.name || "Student"} • Due {formatDate(issue.dueDate)}</p></div><StatusBadge value={issue.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-5"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Issue Date</p><p className="mt-2 font-semibold text-ink">{formatDate(issue.issueDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Return Date</p><p className="mt-2 font-semibold text-ink">{formatDate(issue.returnDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fine</p><p className="mt-2 font-semibold text-ink">{formatCurrency(issue.fineAmount)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Issued By</p><p className="mt-2 font-semibold text-ink">{issue.issuedBy?.name || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Remarks</p><p className="mt-2 font-semibold text-ink">{issue.remarks || "-"}</p></div></div><div className="mt-5 flex flex-wrap gap-2">{!issue.returnDate && issue.status !== "lost" ? <button type="button" onClick={() => handleReturn(issue._id)} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Return Book</button> : null}<button type="button" onClick={() => handleFine(issue._id, issue.fineAmount)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Update Fine</button>{issue.studentId?._id && basePath === "/admin/library" ? <Link to={`/admin/library/students/${issue.studentId._id}/history`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Student History</Link> : null}</div></div>)}</div>}
    </section>
  );
};

export default ManageIssuesPage;
