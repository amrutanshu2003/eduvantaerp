import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const ExamAcademicGroupResults = () => {
  const { examId, academicGroupId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/results/exam/${examId}/academic-group/${academicGroupId}`);
        setResult(data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load result summary");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, academicGroupId]);

  if (loading) return <LoadingBlock message="Loading results..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Exam Result Summary" description="Review result rows for the selected exam and academic group." />
      <AlertMessage tone="error" message={errorMessage} />
      {result ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><p className="text-sm text-slate-600">Result records: {result.summary?.totalRecords || 0}</p></div> : null}
    </section>
  );
};

export default ExamAcademicGroupResults;
