import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getTeacherLabel } from "../../utils/instituteLabels";

const AssignTeacherAcademicGroups = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const label = getTeacherLabel(user);
  const [teacher, setTeacher] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: teacherData }, { data: groupsData }] = await Promise.all([
          api.get(`/teachers/${id}`),
          api.get("/academic-groups"),
        ]);
        setTeacher(teacherData.teacher);
        setGroups(groupsData.academicGroups);
        setSelectedIds((teacherData.teacher.assignedAcademicGroups || []).map((group) => group._id || group));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleGroup = (groupId) => {
    setSelectedIds((current) =>
      current.includes(groupId) ? current.filter((idValue) => idValue !== groupId) : [...current, groupId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/teachers/${id}/assign-academic-groups`, { academicGroupIds: selectedIds });
      window.alert("Academic groups assigned successfully");
      navigate(`/admin/teachers/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to assign academic groups");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message={`Loading ${label.toLowerCase()} assignments...`} />;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">Assign Academic Groups</h1>
        <p className="mt-3 text-sm text-slate-600">Choose academic groups for {teacher?.name}.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="space-y-3">
          {groups.map((group) => (
            <label key={group._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <input type="checkbox" checked={selectedIds.includes(group._id)} onChange={() => toggleGroup(group._id)} />
              <span className="text-sm text-ink">
                {group.className || `${group.department} - ${group.course}`} {group.section ? `(${group.section})` : ""}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : `Assign to ${label}`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AssignTeacherAcademicGroups;
