import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";

const Marks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadMarks = async () => {
      try {
        const { data } = await api.get("/marks");
        setMarks(data.marks);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load marks");
      } finally {
        setLoading(false);
      }
    };
    loadMarks();
  }, []);

  if (loading) return <LoadingBlock message="Loading marks..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Marks" description="Review marks uploads across exams and subjects." />
      <AlertMessage tone="error" message={errorMessage} />
      <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4 font-medium">Exam</th><th className="px-6 py-4 font-medium">Subject</th><th className="px-6 py-4 font-medium">Student</th><th className="px-6 py-4 font-medium">Marks</th><th className="px-6 py-4 font-medium">Status</th></tr></thead>
            <tbody>{marks.map((item) => <tr key={item._id} className="border-t border-slate-100"><td className="px-6 py-4 text-slate-600">{item.examId?.examName || "-"}</td><td className="px-6 py-4 text-slate-600">{item.subjectId?.subjectName || "-"}</td><td className="px-6 py-4 text-slate-600">{item.studentId?.rollNumber || "-"}</td><td className="px-6 py-4 text-slate-600">{item.marksObtained}/{item.totalMarks} ({item.grade})</td><td className="px-6 py-4"><StatusBadge value={item.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Marks;
