import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/exams");
        setExams(data.exams || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load exams");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading exams..." />;
  return <section className="space-y-6"><PageHeader eyebrow="Student" title="My Exams" description="Review exams available for your academic group." /><AlertMessage tone="error" message={errorMessage} /><div className="rounded-[1.75rem] bg-white p-6 shadow-card"><p className="text-sm text-slate-600">Exams available: {exams.length}</p></div></section>;
};

export default Exams;
