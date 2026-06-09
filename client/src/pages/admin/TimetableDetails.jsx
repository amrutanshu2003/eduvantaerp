import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";

const TimetableDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get(`/timetables/${id}`);
        setTimetable(data.timetable);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load timetable details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this timetable?")) return;
    try {
      await api.delete(`/timetables/${id}`);
      window.alert("Timetable deleted successfully");
      navigate("/admin/timetables");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete timetable");
    }
  };

  if (loading) return <LoadingBlock message="Loading timetable details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Timetable Details" description="Review all periods for the selected academic group and day." actions={<div className="flex flex-wrap gap-3"><Link to={`/admin/timetables/${id}/edit`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Edit Timetable</Link><button type="button" onClick={handleDelete} className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">Delete</button></div>} />
      <AlertMessage tone="error" message={errorMessage} />
      {timetable ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge value={timetable.status} /><StatusBadge value={timetable.dayOfWeek} /></div>
          <h3 className="mt-4 text-2xl font-semibold text-ink">{timetable.academicGroupId?.className || [timetable.academicGroupId?.department, timetable.academicGroupId?.course, timetable.academicGroupId?.section].filter(Boolean).join(" - ")}</h3>
          <div className="mt-6 grid gap-4">
            {timetable.periods.map((period) => (
              <div key={`${period.periodNumber}-${period.startTime}`} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Period {period.periodNumber}</p>
                    <h4 className="mt-2 text-lg font-semibold text-ink">{period.subjectId?.subjectName || formatLabel(period.type)}</h4>
                  </div>
                  <StatusBadge value={period.type} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time</p><p className="mt-2 font-semibold text-ink">{period.startTime} - {period.endTime}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher</p><p className="mt-2 font-semibold text-ink">{period.teacherId?.name || "-"}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room</p><p className="mt-2 font-semibold text-ink">{period.roomNumber || "-"}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject Code</p><p className="mt-2 font-semibold text-ink">{period.subjectId?.subjectCode || "-"}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default TimetableDetails;
