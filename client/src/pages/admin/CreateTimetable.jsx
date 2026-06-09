import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import TimetableForm from "../../components/timetables/TimetableForm";
import { timetableFormDefaults } from "../../utils/timetableOptions";

const CreateTimetable = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(timetableFormDefaults);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [{ data: groupData }, { data: subjectData }, { data: teacherData }] = await Promise.all([
          api.get("/academic-groups"),
          api.get("/subjects"),
          api.get("/teachers"),
        ]);
        setAcademicGroups(groupData.academicGroups || []);
        setSubjects(subjectData.subjects || []);
        setTeachers(teacherData.teachers || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load timetable form options");
      }
    };
    loadOptions();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handlePeriodChange = (index, key, value) => setFormData((current) => ({ ...current, periods: current.periods.map((period, periodIndex) => (periodIndex === index ? { ...period, [key]: value } : period)) }));
  const handleAddPeriod = () => setFormData((current) => ({ ...current, periods: [...current.periods, { periodNumber: current.periods.length + 1, subjectId: "", teacherId: "", startTime: "10:00", endTime: "11:00", roomNumber: "", type: "theory" }] }));
  const handleRemovePeriod = (index) => setFormData((current) => ({ ...current, periods: current.periods.filter((_, periodIndex) => periodIndex !== index) }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/timetables", {
        ...formData,
        periods: formData.periods.map((period) => ({ ...period, periodNumber: Number(period.periodNumber) })),
      });
      window.alert("Timetable created successfully");
      navigate(`/admin/timetables/${data.timetable._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create timetable");
    } finally {
      setSubmitting(false);
    }
  };

  return <TimetableForm title="Create Timetable" description="Set up daily periods for one academic group." formData={formData} academicGroups={academicGroups} subjects={subjects} teachers={teachers} onChange={handleChange} onPeriodChange={handlePeriodChange} onAddPeriod={handleAddPeriod} onRemovePeriod={handleRemovePeriod} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateTimetable;
