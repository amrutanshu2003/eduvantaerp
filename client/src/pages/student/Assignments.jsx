import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatLabel } from "../../utils/formatters";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/assignments/my-assignments");
        setAssignments(data.assignments || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingCount = useMemo(() => assignments.filter((assignment) => !assignment.submission || assignment.submission.status !== "reviewed").length, [assignments]);

  if (loading) return <LoadingBlock message="Loading assignments..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Student" title="My Assignments" description="Track upcoming work, submission status, and feedback from teachers." /><AlertMessage tone="error" message={errorMessage} /><div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pending Assignments</p><p className="mt-3 text-3xl font-semibold text-ink">{pendingCount}</p></div>{assignments.length === 0 ? <EmptyState title="No assignments found" description="Published assignments for your class will appear here." /> : <div className="grid gap-4">{assignments.map((assignment) => <div key={assignment._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{assignment.title}</h3><p className="mt-2 text-sm text-slate-600">{assignment.subjectId?.subjectName || "-"} • Due {formatDate(assignment.dueDate)}</p></div><StatusBadge value={assignment.submission?.status || assignment.status} /></div><div className="mt-5 flex flex-wrap gap-2"><StatusBadge value={formatLabel(assignment.assignmentType)} /><Link to={`/student/assignments/${assignment._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>{assignment.status !== "closed" ? <Link to={`/student/assignments/${assignment._id}/submit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{assignment.submission ? "Update Submission" : "Submit"}</Link> : null}</div></div>)}</div>}</section>;
};

export default Assignments;
