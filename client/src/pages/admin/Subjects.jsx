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
import { getSubjectLabelPlural, getInstituteType } from "../../utils/instituteLabels";

const Subjects = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data } = await api.get("/subjects");
        setSubjects(data.subjects);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subjects");
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, []);

  const handleDelete = async (subjectId) => {
    if (!(await window.confirm("Are you sure you want to delete this subject?"))) {
      return;
    }
    try {
      await api.delete(`/subjects/${subjectId}`);
      setSubjects((current) => current.filter((s) => s._id !== subjectId));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete subject");
    }
  };

  if (loading) return <LoadingBlock message="Loading subjects..." />;

  const instituteType = getInstituteType(user);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={getSubjectLabelPlural(user)}
        description={`Manage subjects, ${["college", "university"].includes(instituteType) ? "academic group" : "class"} mapping and faculty assignment.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Bulk Import
            </Link>
            <Link
              to="/admin/subjects/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Create Subject
            </Link>
          </div>
        }
      />
      <AlertMessage tone="error" message={errorMessage} />
      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Create the first subject for this institute to map with classes and assign teachers."
          actionText="Create Subject"
          actionLink="/admin/subjects/create"
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">
                    {["college", "university"].includes(instituteType) ? "Academic Group" : "Class"}
                  </th>
                  <th className="px-6 py-4 font-medium">Teacher</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject._id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{subject.subjectName}</p>
                      <p className="text-xs text-slate-500">{subject.subjectCode}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {subject.academicGroupId?.className || subject.academicGroupId?.department || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{subject.teacherId?.name || "Unassigned"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge value={subject.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/subjects/${subject._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          View
                        </Link>
                        <Link to={`/admin/subjects/${subject._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          Edit
                        </Link>
                        <Link to={`/admin/subjects/${subject._id}/assign-teacher`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          Assign
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(subject._id)}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                        >
                          Delete
                        </button>
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

export default Subjects;
