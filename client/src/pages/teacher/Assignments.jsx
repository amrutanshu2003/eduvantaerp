import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";

const Assignments = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/assignments");
        setAssignments(data.assignments || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading your assignments..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title="My Assignments" description="Create, publish, and manage assignments for your subjects." actions={<Link to="/teacher/assignments/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Create Assignment</Link>} /><AlertMessage tone="error" message={errorMessage} />{assignments.length === 0 ? <EmptyState title="No assignments yet" description="Create the first assignment for one of your classes." /> : <div className="grid gap-4">{assignments.map((assignment) => <div key={assignment._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{assignment.title}</h3><p className="mt-2 text-sm text-slate-600">{assignment.subjectId?.subjectName || "-"} • Due {formatDate(assignment.dueDate)}</p></div><StatusBadge value={assignment.status} /></div><div className="mt-5 flex flex-wrap gap-2"><Link to={`/teacher/assignments/${assignment._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`/teacher/assignments/${assignment._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><Link to={`/teacher/assignments/${assignment._id}/submissions`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Submissions</Link><StatusBadge value={formatLabel(assignment.assignmentType)} /></div></div>)}</div>}</section>;
};

export default Assignments;
