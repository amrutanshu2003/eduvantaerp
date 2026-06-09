import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Results = () => {
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ examId: "", academicGroupId: "" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: examsData }, { data: groupsData }] = await Promise.all([api.get("/exams"), api.get("/academic-groups")]);
        setExams(examsData.exams);
        setGroups(groupsData.academicGroups);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load result filters");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingBlock message="Loading results..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Results" description="Open exam and academic-group level result summaries." />
      <AlertMessage tone="error" message={errorMessage} />
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <select value={filters.examId} onChange={(event) => setFilters((current) => ({ ...current, examId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="">Select Exam</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.examName}</option>)}</select>
          <select value={filters.academicGroupId} onChange={(event) => setFilters((current) => ({ ...current, academicGroupId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="">Select Academic Group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select>
          <Link to={filters.examId && filters.academicGroupId ? `/admin/results/exam/${filters.examId}/academic-group/${filters.academicGroupId}` : "#"} className={`rounded-2xl px-5 py-3 text-center text-sm font-semibold ${filters.examId && filters.academicGroupId ? "bg-slate-900 text-white" : "pointer-events-none bg-slate-100 text-slate-400"}`}>Open Result Summary</Link>
        </div>
      </div>
    </section>
  );
};

export default Results;
