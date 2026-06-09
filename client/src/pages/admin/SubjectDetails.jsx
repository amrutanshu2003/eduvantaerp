import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";

const SubjectDetails = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSubject = async () => {
      try {
        const { data } = await api.get(`/subjects/${id}`);
        setSubject(data.subject);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subject");
      } finally {
        setLoading(false);
      }
    };
    loadSubject();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading subject details..." />;
  if (!subject) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Subject" title={subject.subjectName} description="Review subject details and assigned teacher." actions={<div className="flex gap-3"><Link to={`/admin/subjects/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit</Link><Link to={`/admin/subjects/${id}/assign-teacher`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Assign Teacher</Link></div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Code</p><p className="mt-3 font-semibold text-ink">{subject.subjectCode}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-3 font-semibold text-ink capitalize">{subject.subjectType}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher</p><p className="mt-3 font-semibold text-ink">{subject.teacherId?.name || "Unassigned"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={subject.status} /></div></div>
      </div>
    </section>
  );
};

export default SubjectDetails;
