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
    const load = async () => {
      try {
        const { data } = await api.get("/attendance");
        setAttendance(data.attendance);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading attendance history..." />;
  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title="Attendance History" description="Review attendance records you submitted." /><AlertMessage tone="error" message={errorMessage} /><div className="rounded-[1.75rem] bg-white p-6 shadow-card"><p className="text-sm text-slate-600">Attendance records: {attendance.length}</p></div></section>;
};

export default Attendance;
