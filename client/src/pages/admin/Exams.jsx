import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const Exams = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/exams");
        setExams(data.exams);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load exams");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading exams..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Exams" description="Manage exams and publication status for academic groups." actions={<Link to="/admin/exams/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Create Exam</Link>} />
      <AlertMessage tone="error" message={errorMessage} />
      {exams.length === 0 ? <EmptyState title="No exams yet" description="Create the first exam for this institute." /> : <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4 font-medium">Exam</th><th className="px-6 py-4 font-medium">Academic Group</th><th className="px-6 py-4 font-medium">Dates</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead><tbody>{exams.map((exam) => <tr key={exam._id} className="border-t border-slate-100"><td className="px-6 py-4"><p className="font-medium text-ink">{exam.examName}</p><p className="text-xs text-slate-500">{exam.examType}</p></td><td className="px-6 py-4 text-slate-600">{exam.academicGroupId?.className || exam.academicGroupId?.department || "-"}</td><td className="px-6 py-4 text-slate-600">{String(exam.startDate).slice(0,10)} - {String(exam.endDate).slice(0,10)}</td><td className="px-6 py-4"><StatusBadge value={exam.status} /></td><td className="px-6 py-4"><div className="flex flex-wrap gap-2"><Link to={`/admin/exams/${exam._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`/admin/exams/${exam._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link></div></td></tr>)}</tbody></table></div></div>}
    </section>
  );
};

export default Exams;
