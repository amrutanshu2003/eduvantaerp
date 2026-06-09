import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatLabel } from "../../utils/formatters";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ teacherId: "all", academicGroupId: "all", subjectId: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: assignmentData }, { data: teacherData }, { data: groupData }, { data: subjectData }] = await Promise.all([
          api.get("/assignments", { params: filters }),
          api.get("/teachers"),
          api.get("/academic-groups"),
          api.get("/subjects"),
        ]);
        setAssignments(assignmentData.assignments || []);
        setTeachers(teacherData.teachers || []);
        setAcademicGroups(groupData.academicGroups || []);
        setSubjects(subjectData.subjects || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.teacherId, filters.academicGroupId, filters.subjectId, filters.status]);

  if (loading) return <LoadingBlock message="Loading assignments..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Admin" title="Assignments" description="Review assignment activity across teachers, academic groups, and subjects." /><div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4"><select value={filters.teacherId} onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))} className={filterClass}><option value="all">All Teachers</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}</select><select value={filters.academicGroupId} onChange={(event) => setFilters((current) => ({ ...current, academicGroupId: event.target.value }))} className={filterClass}><option value="all">All Groups</option>{academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}</select><select value={filters.subjectId} onChange={(event) => setFilters((current) => ({ ...current, subjectId: event.target.value }))} className={filterClass}><option value="all">All Subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}</select><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="all">All Status</option><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></div><AlertMessage tone="error" message={errorMessage} />{assignments.length === 0 ? <EmptyState title="No assignments found" description="Assignments created by teachers will appear here." /> : <div className="grid gap-4">{assignments.map((assignment) => <div key={assignment._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{assignment.title}</h3><p className="mt-2 text-sm text-slate-600">{assignment.teacherId?.name || "-"} • {assignment.subjectId?.subjectName || "-"}</p></div><StatusBadge value={assignment.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-2 font-semibold text-ink">{formatLabel(assignment.assignmentType)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p><p className="mt-2 font-semibold text-ink">{formatDate(assignment.dueDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{assignment.academicGroupId?.className || [assignment.academicGroupId?.department, assignment.academicGroupId?.course].filter(Boolean).join(" - ") || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Marks</p><p className="mt-2 font-semibold text-ink">{assignment.maxMarks || "-"}</p></div></div></div>)}</div>}</section>;
};

export default Assignments;
