import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getTeacherLabel, getTeacherLabelPlural } from "../../utils/instituteLabels";

const Teachers = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const singularLabel = getTeacherLabel(user);
  const pluralLabel = getTeacherLabelPlural(user);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/teachers");
      setTeachers(data.teachers);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || `Unable to load ${pluralLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleStatusToggle = async (teacher) => {
    const status = teacher.status === "active" ? "inactive" : "active";
    await api.patch(`/teachers/${teacher._id}/status`, { status });
    setMessageTone("success");
    setMessage(`${singularLabel} marked as ${status}`);
    fetchTeachers();
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Delete this ${singularLabel.toLowerCase()}?`)) {
      return;
    }
    await api.delete(`/teachers/${teacher._id}`);
    setMessageTone("success");
    setMessage(`${singularLabel} deleted successfully`);
    fetchTeachers();
  };

  if (loading) {
    return <LoadingBlock message={`Loading ${pluralLabel.toLowerCase()}...`} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={pluralLabel}
        description={`Manage ${pluralLabel.toLowerCase()} within your institute.`}
        actions={
          <Link
            to="/admin/teachers/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create {singularLabel}
          </Link>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {teachers.length === 0 ? (
        <EmptyState title={`No ${pluralLabel.toLowerCase()} yet`} description={`Create the first ${singularLabel.toLowerCase()} for this institute.`} />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-ink">{teacher.name}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                    <td className="px-6 py-4 text-slate-600">{teacher.department || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge value={teacher.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/teachers/${teacher._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                        <Link to={`/admin/teachers/${teacher._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                        <Link to={`/admin/teachers/${teacher._id}/assign`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Assign</Link>
                        <button type="button" onClick={() => handleStatusToggle(teacher)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{teacher.status === "active" ? "Deactivate" : "Activate"}</button>
                        <button type="button" onClick={() => handleDelete(teacher)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">Delete</button>
                      </div>
                    </td>
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

export default Teachers;
