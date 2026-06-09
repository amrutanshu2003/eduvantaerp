import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";

const AssignSubjectTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: subjectData }, { data: teachersData }] = await Promise.all([api.get(`/subjects/${id}`), api.get("/teachers")]);
        setTeacherId(subjectData.subject.teacherId?._id || "");
        setTeachers(teachersData.teachers);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load teacher assignment");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/subjects/${id}/assign-teacher`, { teacherId });
      window.alert("Teacher assigned successfully");
      navigate(`/admin/subjects/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to assign teacher");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading teacher assignment..." />;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><h1 className="text-3xl font-semibold text-ink">Assign Teacher</h1><p className="mt-3 text-sm text-slate-600">Choose a teacher for this subject.</p></div>
      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <label className="mb-2 block text-sm font-medium text-slate-700">Teacher</label>
        <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
          <option value="">Select Teacher</option>
          {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
        </select>
        <div className="mt-6 space-y-4"><AlertMessage tone="error" message={errorMessage} /><button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Assign Teacher"}</button></div>
      </form>
    </section>
  );
};

export default AssignSubjectTeacher;
