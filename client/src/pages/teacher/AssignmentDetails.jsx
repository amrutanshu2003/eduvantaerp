import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatDate, formatLabel } from "../../utils/formatters";

const AssignmentDetails = () => {
  const { id } = useParams();
  const { settings, getButtonRadius } = useUISettings();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/assignments/${id}`);
        setAssignment(data.assignment);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      const { data } = await api.patch(`/assignments/${id}/status`, { status });
      setAssignment(data.assignment);
      window.alert(`Assignment marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update assignment status");
    }
  };

  if (loading) return <LoadingBlock message="Loading assignment..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title={assignment?.title || "Assignment Details"} description="Review the assignment, then publish or close it when needed." actions={<div className="flex flex-wrap gap-3"><Link to={`/teacher/assignments/${id}/edit`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Edit Assignment</Link><Link to={`/teacher/assignments/${id}/submissions`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">View Submissions</Link></div>} /><AlertMessage tone="error" message={errorMessage} />{assignment ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap gap-2"><StatusBadge value={assignment.status} /><StatusBadge value={assignment.assignmentType} /></div><div className="mt-6 grid gap-4 md:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{assignment.academicGroupId?.className || [assignment.academicGroupId?.department, assignment.academicGroupId?.course].filter(Boolean).join(" - ") || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject</p><p className="mt-2 font-semibold text-ink">{assignment.subjectId?.subjectName || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p><p className="mt-2 font-semibold text-ink">{formatDate(assignment.dueDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Marks</p><p className="mt-2 font-semibold text-ink">{assignment.maxMarks || "-"}</p></div></div><div className="mt-6 rounded-3xl bg-slate-50 p-5"><p className="text-sm leading-7 text-slate-700">{assignment.description}</p></div><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => handleStatusUpdate("draft")} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Draft</button><button type="button" onClick={() => handleStatusUpdate("published")} className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">Publish</button><button type="button" onClick={() => handleStatusUpdate("closed")} className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700">Close</button></div></div> : null}</section>;
};

export default AssignmentDetails;
