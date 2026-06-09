import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatLabel } from "../../utils/formatters";

const AssignmentDetails = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: assignmentData }, { data: myData }] = await Promise.all([
          api.get(`/assignments/${id}`),
          api.get("/assignments/my-assignments"),
        ]);
        const current = (myData.assignments || []).find((entry) => entry._id === id) || null;
        setAssignment({ ...assignmentData.assignment, submission: current?.submission || null });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading assignment..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Student" title={assignment?.title || "Assignment Details"} description="Read instructions carefully and review your submission status." /><AlertMessage tone="error" message={errorMessage} />{assignment ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap gap-2"><StatusBadge value={assignment.status} /><StatusBadge value={assignment.submission?.status || "pending"} /><StatusBadge value={assignment.assignmentType} /></div><div className="mt-6 grid gap-4 md:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject</p><p className="mt-2 font-semibold text-ink">{assignment.subjectId?.subjectName || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p><p className="mt-2 font-semibold text-ink">{formatDate(assignment.dueDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(assignment.assignmentType)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Marks</p><p className="mt-2 font-semibold text-ink">{assignment.maxMarks || "-"}</p></div></div><div className="mt-6 rounded-3xl bg-slate-50 p-5"><p className="text-sm leading-7 text-slate-700">{assignment.description}</p></div>{assignment.submission ? <div className="mt-6 rounded-3xl border border-slate-200 p-5"><h3 className="text-lg font-semibold text-ink">My Submission</h3><p className="mt-3 text-sm text-slate-600">{assignment.submission.answerText || "No answer text saved."}</p><p className="mt-3 text-sm text-slate-600">Marks: {assignment.submission.marksObtained ?? "-"} • Feedback: {assignment.submission.feedback || "-"}</p></div> : null}{assignment.status !== "closed" ? <div className="mt-6"><Link to={`/student/assignments/${assignment._id}/submit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Submit Assignment</Link></div> : null}</div> : null}</section>;
};

export default AssignmentDetails;
