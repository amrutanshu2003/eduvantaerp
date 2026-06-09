import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";

const ExamDetails = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadExam = async () => {
      try {
        const { data } = await api.get(`/exams/${id}`);
        setExam(data.exam);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load exam");
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading exam details..." />;
  if (!exam) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Exam" title={exam.examName} description="Review exam details and publication status." actions={<Link to={`/admin/exams/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit</Link>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-3 font-semibold text-ink">{exam.examType}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-3 font-semibold text-ink">{exam.academicGroupId?.className || exam.academicGroupId?.department || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Start Date</p><p className="mt-3 font-semibold text-ink">{String(exam.startDate).slice(0,10)}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={exam.status} /></div></div>
      </div>
    </section>
  );
};

export default ExamDetails;
