import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const { data } = await api.get("/attendance");
        setAttendance(data.attendance);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, []);

  if (loading) return <LoadingBlock message="Loading attendance..." />;
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Attendance" description="View attendance submissions across academic groups." />
      <AlertMessage tone="error" message={errorMessage} />
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <p className="text-sm text-slate-600">Attendance records available: {attendance.length}</p>
      </div>
    </section>
  );
};

export default Attendance;
