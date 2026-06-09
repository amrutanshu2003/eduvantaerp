import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getParentLabel } from "../../utils/instituteLabels";

const LinkParentStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const label = getParentLabel(user);
  const [parent, setParent] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: parentData }, { data: studentsData }] = await Promise.all([
          api.get(`/parents/${id}`),
          api.get("/students"),
        ]);
        setParent(parentData.parent);
        setStudents(studentsData.students);
        setSelectedIds((parentData.parent.linkedStudentIds || []).map((student) => student._id || student));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load link data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleStudent = (studentId) => {
    setSelectedIds((current) =>
      current.includes(studentId) ? current.filter((value) => value !== studentId) : [...current, studentId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/parents/${id}/link-students`, { linkedStudentIds: selectedIds });
      window.alert("Students linked successfully");
      navigate(`/admin/parents/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to link students");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message={`Loading ${label.toLowerCase()} links...`} />;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">Link Students</h1>
        <p className="mt-3 text-sm text-slate-600">Choose students for {parent?.name}.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="space-y-3">
          {students.map((student) => (
            <label key={student._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <input type="checkbox" checked={selectedIds.includes(student._id)} onChange={() => toggleStudent(student._id)} />
              <span className="text-sm text-ink">{student.user?.name} - {student.rollNumber}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : `Link to ${label}`}</button>
        </div>
      </form>
    </section>
  );
};

export default LinkParentStudents;
