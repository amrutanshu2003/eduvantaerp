import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getParentLabel } from "../../utils/instituteLabels";

const ParentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const label = getParentLabel(user);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const { data } = await api.get(`/parents/${id}`);
        setParent(data.parent);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load parent");
      } finally {
        setLoading(false);
      }
    };
    fetchParent();
  }, [id]);

  if (loading) return <LoadingBlock message={`Loading ${label.toLowerCase()} details...`} />;
  if (!parent) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={label} title={parent.name} description={`Review ${label.toLowerCase()} profile and linked students.`} actions={<div className="flex gap-3"><Link to={`/admin/parents/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit</Link><Link to={`/admin/parents/${id}/link-students`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Link Students</Link></div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p><p className="mt-3 font-semibold text-ink">{parent.email}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Relation</p><p className="mt-3 font-semibold text-ink capitalize">{parent.relation || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Linked Students</p><p className="mt-3 font-semibold text-ink">{parent.linkedStudentIds?.length || 0}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={parent.status} /></div></div>
      </div>
    </section>
  );
};

export default ParentDetails;
