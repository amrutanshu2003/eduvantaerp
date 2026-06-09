import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/subjects");
        setSubjects(data.subjects);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subjects");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading your subjects..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Teacher" title="My Subjects" description="Review subjects assigned to you." />
      <AlertMessage tone="error" message={errorMessage} />
      {subjects.length === 0 ? <EmptyState title="No assigned subjects" description="Assigned subjects will appear here." /> : <div className="grid gap-4 md:grid-cols-2">{subjects.map((subject) => <Link key={subject._id} to={`/teacher/subjects/${subject._id}`} className="rounded-[1.5rem] bg-white p-6 shadow-card"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">{subject.subjectCode}</p><h3 className="mt-3 text-2xl font-semibold text-ink">{subject.subjectName}</h3></Link>)}</div>}
    </section>
  );
};

export default Subjects;
