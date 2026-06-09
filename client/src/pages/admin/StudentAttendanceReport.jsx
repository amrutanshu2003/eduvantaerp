import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const StudentAttendanceReport = () => {
  const { studentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        const { data } = await api.get(`/attendance/reports/student/${studentId}`);
        setReport(data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load attendance report");
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [studentId]);

  if (loading) return <LoadingBlock message="Loading student attendance..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Student Attendance Report" description="Review attendance summary for a specific student." />
      <AlertMessage tone="error" message={errorMessage} />
      {report ? <div className="grid gap-4 md:grid-cols-5">{["present", "absent", "late", "leave", "percentage"].map((key) => <div key={key} className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{key}</p><p className="mt-3 font-semibold text-ink">{report.summary[key]}{key === "percentage" ? "%" : ""}</p></div>)}</div> : null}
    </section>
  );
};

export default StudentAttendanceReport;
