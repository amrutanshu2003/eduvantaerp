import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const Students = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "all", academicGroupId: "all" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: studentsData }, { data: groupsData }] = await Promise.all([
        api.get("/students", { params: filters }),
        api.get("/academic-groups"),
      ]);
      setStudents(studentsData.students);
      setGroups(groupsData.academicGroups);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSearch = (event) => {
    event.preventDefault();
    fetchData();
  };

  const handleStatusToggle = async (student) => {
    const status = student.status === "active" ? "inactive" : "active";
    await api.patch(`/students/${student._id}/status`, { status });
    setMessageTone("success");
    setMessage(`Student marked as ${status}`);
    fetchData();
  };

  const handleDelete = async (student) => {
    if (!(await window.confirm("Delete this student?"))) return;
    await api.delete(`/students/${student._id}`);
    setMessageTone("success");
    setMessage("Student deleted successfully");
    fetchData();
  };

  if (loading) return <LoadingBlock message="Loading students..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Students"
        description="Manage student accounts, profiles and academic group assignments."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Bulk Import
            </Link>
            <Link to="/admin/students/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Create Student</Link>
          </div>
        }
      />
      <AlertMessage tone={messageTone} message={message} />
      <form onSubmit={handleSearch} className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input name="search" value={filters.search} onChange={handleChange} placeholder="Search by name or roll number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <select name="status" value={filters.status} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <select name="academicGroupId" value={filters.academicGroupId} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="all">All Academic Groups</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}</select>
        <button type="submit" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Search</button>
      </form>
      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Create the first student account for this institute." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4 font-medium">Student</th><th className="px-6 py-4 font-medium">Roll Number</th><th className="px-6 py-4 font-medium">Academic Group</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id} className="border-t border-slate-100">
                    <td className="px-6 py-4"><p className="font-medium text-ink">{student.user?.name}</p><p className="text-xs text-slate-500">{student.user?.email}</p></td>
                    <td className="px-6 py-4 text-slate-600">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{student.academicGroupId?.className || student.academicGroupId?.department || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge value={student.status} /></td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-2"><Link to={`/admin/students/${student._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`/admin/students/${student._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><button type="button" onClick={() => handleStatusToggle(student)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{student.status === "active" ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => handleDelete(student)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default Students;
