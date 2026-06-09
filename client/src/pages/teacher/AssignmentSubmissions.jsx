import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";

const AssignmentSubmissions = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/assignments/${id}/submissions`);
        setSubmissions(data.submissions || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load submissions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReview = async (submissionId) => {
    const marksObtained = window.prompt("Enter marks obtained");
    const feedback = window.prompt("Enter feedback");
    if (marksObtained === null && feedback === null) return;

    try {
      const { data } = await api.patch(`/assignments/submissions/${submissionId}/review`, { marksObtained, feedback });
      setSubmissions((current) => current.map((submission) => (submission._id === submissionId ? data.submission : submission)));
      window.alert("Submission reviewed successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to review submission");
    }
  };

  if (loading) return <LoadingBlock message="Loading submissions..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title="Assignment Submissions" description="Review submitted work, then assign marks and feedback." /><AlertMessage tone="error" message={errorMessage} />{submissions.length === 0 ? <EmptyState title="No submissions yet" description="Student submissions will appear here once they submit." /> : <div className="grid gap-4">{submissions.map((submission) => <div key={submission._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{submission.studentId?.userId?.name || "Student"}</h3><p className="mt-2 text-sm text-slate-600">{submission.studentId?.rollNumber || ""}</p></div><StatusBadge value={submission.status} /></div><div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{submission.answerText || "No answer text submitted."}</div><div className="mt-5 grid gap-4 md:grid-cols-3"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Marks</p><p className="mt-2 font-semibold text-ink">{submission.marksObtained ?? "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Feedback</p><p className="mt-2 font-semibold text-ink">{submission.feedback || "-"}</p></div><div className="flex items-end"><button type="button" onClick={() => handleReview(submission._id)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Review Submission</button></div></div></div>)}</div>}</section>;
};

export default AssignmentSubmissions;
