import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AssignmentForm from "../../components/assignments/AssignmentForm";
import { assignmentFormDefaults } from "../../utils/assignmentOptions";

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(assignmentFormDefaults);
  const [subjects, setSubjects] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/subjects");
        const nextSubjects = data.subjects || [];
        setSubjects(nextSubjects);
        const groups = nextSubjects.reduce((collection, subject) => {
          const group = subject.academicGroupId;
          if (group && !collection.find((entry) => entry._id === group._id)) collection.push(group);
          return collection;
        }, []);
        setAcademicGroups(groups);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment options");
      }
    };
    load();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/assignments", formData);
      window.alert("Assignment created successfully");
      navigate(`/teacher/assignments/${data.assignment._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return <AssignmentForm title="Create Assignment" description="Create homework, projects, lab work, or research tasks for your class." formData={formData} academicGroups={academicGroups} subjects={subjects} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateAssignment;
