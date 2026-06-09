import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import TimetableForm from "../../components/timetables/TimetableForm";

const EditTimetable = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: timetableData }, { data: groupData }, { data: subjectData }, { data: teacherData }] = await Promise.all([
          api.get(`/timetables/${id}`),
          api.get("/academic-groups"),
          api.get("/subjects"),
          api.get("/teachers"),
        ]);
        setFormData({
          academicGroupId: timetableData.timetable.academicGroupId?._id || timetableData.timetable.academicGroupId || "",
          dayOfWeek: timetableData.timetable.dayOfWeek,
          status: timetableData.timetable.status,
          periods: timetableData.timetable.periods.map((period) => ({
            periodNumber: period.periodNumber,
            subjectId: period.subjectId?._id || period.subjectId || "",
            teacherId: period.teacherId?._id || period.teacherId || "",
            startTime: period.startTime,
            endTime: period.endTime,
            roomNumber: period.roomNumber || "",
            type: period.type,
          })),
        });
        setAcademicGroups(groupData.academicGroups || []);
        setSubjects(subjectData.subjects || []);
        setTeachers(teacherData.teachers || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load timetable");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handlePeriodChange = (index, key, value) => setFormData((current) => ({ ...current, periods: current.periods.map((period, periodIndex) => (periodIndex === index ? { ...period, [key]: value } : period)) }));
  const handleAddPeriod = () => setFormData((current) => ({ ...current, periods: [...current.periods, { periodNumber: current.periods.length + 1, subjectId: "", teacherId: "", startTime: "10:00", endTime: "11:00", roomNumber: "", type: "theory" }] }));
  const handleRemovePeriod = (index) => setFormData((current) => ({ ...current, periods: current.periods.filter((_, periodIndex) => periodIndex !== index) }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/timetables/${id}`, { ...formData, periods: formData.periods.map((period) => ({ ...period, periodNumber: Number(period.periodNumber) })) });
      window.alert("Timetable updated successfully");
      navigate(`/admin/timetables/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update timetable");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) return <LoadingBlock message="Loading timetable..." />;

  return <TimetableForm title="Edit Timetable" description="Update timetable periods, rooms, and assigned teachers." formData={formData} academicGroups={academicGroups} subjects={subjects} teachers={teachers} onChange={handleChange} onPeriodChange={handlePeriodChange} onAddPeriod={handleAddPeriod} onRemovePeriod={handleRemovePeriod} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditTimetable;
