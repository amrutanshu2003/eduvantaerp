import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatLabel } from "../../utils/formatters";

const ChildAssignments = () => {
  const { studentId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/assignments/child/${studentId}`);
        setAssignments(data.assignments || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load child assignments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) return <LoadingBlock message="Loading child assignments..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Parent" title="Child Assignments" description="Review assignment deadlines and child submission status." /><AlertMessage tone="error" message={errorMessage} />{assignments.length === 0 ? <EmptyState title="No assignments found" description="No assignments are available for this child yet." /> : <div className="grid gap-4">{assignments.map((assignment) => <div key={assignment._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{assignment.title}</h3><p className="mt-2 text-sm text-slate-600">{assignment.subjectId?.subjectName || "-"} • Due {formatDate(assignment.dueDate)}</p></div><StatusBadge value={assignment.submission?.status || assignment.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(assignment.assignmentType)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Marks</p><p className="mt-2 font-semibold text-ink">{assignment.submission?.marksObtained ?? "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Feedback</p><p className="mt-2 font-semibold text-ink">{assignment.submission?.feedback || "-"}</p></div></div></div>)}</div>}</section>;
};

export default ChildAssignments;
