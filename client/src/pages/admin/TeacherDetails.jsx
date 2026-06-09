import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getTeacherLabel } from "../../utils/instituteLabels";

const TeacherDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const label = getTeacherLabel(user);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data } = await api.get(`/teachers/${id}`);
        setTeacher(data.teacher);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load teacher");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  if (loading) return <LoadingBlock message={`Loading ${label.toLowerCase()} details...`} />;
  if (!teacher) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={label} title={teacher.name} description={`Review ${label.toLowerCase()} profile, department and status.`} actions={<div className="flex gap-3"><Link to={`/admin/teachers/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit</Link><Link to={`/admin/teachers/${id}/assign`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Assign Academic Groups</Link></div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p><p className="mt-3 font-semibold text-ink">{teacher.email}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Employee ID</p><p className="mt-3 font-semibold text-ink">{teacher.employeeId || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Department</p><p className="mt-3 font-semibold text-ink">{teacher.department || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={teacher.status} /></div></div>
      </div>
    </section>
  );
};

export default TeacherDetails;
