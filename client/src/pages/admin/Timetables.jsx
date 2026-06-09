import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { dayOptions } from "../../utils/timetableOptions";
import { formatLabel } from "../../utils/formatters";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const Timetables = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [timetables, setTimetables] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({ academicGroupId: "all", teacherId: "all", dayOfWeek: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      const [{ data: timetableData }, { data: groupData }, { data: teacherData }] = await Promise.all([
        api.get("/timetables", { params: filters }),
        api.get("/academic-groups"),
        api.get("/teachers"),
      ]);
      setTimetables(timetableData.timetables || []);
      setAcademicGroups(groupData.academicGroups || []);
      setTeachers(teacherData.teachers || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load timetables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.academicGroupId, filters.teacherId, filters.dayOfWeek]);

  const filteredTimetables = useMemo(() => timetables, [timetables]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.patch(`/timetables/${id}/status`, { status });
      setTimetables((current) => current.map((item) => (item._id === id ? data.timetable : item)));
      window.alert(`Timetable marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update timetable status");
    }
  };

  if (loading) return <LoadingBlock message="Loading timetables..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Timetable Management"
        description="Create and manage class or semester/batch timetables for each academic group."
        actions={
          <Link to="/admin/timetables/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">
            Create Timetable
          </Link>
        }
      />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
        <select value={filters.academicGroupId} onChange={(event) => setFilters((current) => ({ ...current, academicGroupId: event.target.value }))} className={filterClass}>
          <option value="all">All Academic Groups</option>
          {academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}
        </select>
        <select value={filters.teacherId} onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))} className={filterClass}>
          <option value="all">All Teachers</option>
          {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
        </select>
        <select value={filters.dayOfWeek} onChange={(event) => setFilters((current) => ({ ...current, dayOfWeek: event.target.value }))} className={filterClass}>
          <option value="all">All Days</option>
          {dayOptions.map((day) => <option key={day} value={day}>{formatLabel(day)}</option>)}
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {filteredTimetables.length === 0 ? (
        <EmptyState title="No timetables found" description="Create a timetable or adjust filters to see records." />
      ) : (
        <div className="grid gap-4">
          {filteredTimetables.map((timetable) => (
            <div key={timetable._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{timetable.academicGroupId?.className || [timetable.academicGroupId?.department, timetable.academicGroupId?.course, timetable.academicGroupId?.section].filter(Boolean).join(" - ")}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formatLabel(timetable.dayOfWeek)} • {timetable.periods.length} periods</p>
                </div>
                <StatusBadge value={timetable.status} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/admin/timetables/${timetable._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                <Link to={`/admin/timetables/${timetable._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                <button type="button" onClick={() => handleStatusUpdate(timetable._id, timetable.status === "active" ? "inactive" : "active")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  {timetable.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Timetables;
