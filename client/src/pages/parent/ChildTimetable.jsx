import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatLabel } from "../../utils/formatters";

const ChildTimetable = () => {
  const { studentId } = useParams();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/timetables/child/${studentId}`);
        setTimetables(data.timetables || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load child timetable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) return <LoadingBlock message="Loading child timetable..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Parent" title="Child Timetable" description="Review each day and period for the selected child." /><AlertMessage tone="error" message={errorMessage} />{timetables.length === 0 ? <EmptyState title="No timetable found" description="This child does not have an active timetable yet." /> : <div className="grid gap-4">{timetables.map((timetable) => <div key={timetable._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{formatLabel(timetable.dayOfWeek)}</h3><p className="mt-2 text-sm text-slate-600">{timetable.academicGroupId?.className || [timetable.academicGroupId?.department, timetable.academicGroupId?.course, timetable.academicGroupId?.section].filter(Boolean).join(" - ")}</p></div><StatusBadge value={timetable.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-2">{timetable.periods.map((period) => <div key={`${period.periodNumber}-${period.startTime}`} className="rounded-3xl border border-slate-200 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Period {period.periodNumber}</p><h4 className="mt-2 font-semibold text-ink">{period.subjectId?.subjectName || formatLabel(period.type)}</h4><p className="mt-2 text-sm text-slate-600">{period.startTime} - {period.endTime} • {period.teacherId?.name || "No teacher"}</p></div>)}</div></div>)}</div>}</section>;
};

export default ChildTimetable;
