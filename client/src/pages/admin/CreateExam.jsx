import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ExamForm from "./ExamForm";

const CreateExam = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ examName: "", examType: "unit_test", academicGroupId: "", startDate: "", endDate: "", status: "draft" });
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      const { data } = await api.get("/academic-groups");
      setGroups(data.academicGroups);
    };
    loadGroups();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/exams", formData);
      window.alert("Exam created successfully");
      navigate(`/admin/exams/${data.exam._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create exam");
    } finally {
      setSubmitting(false);
    }
  };

  return <ExamForm title="Create Exam" description="Create an exam for a specific academic group." formData={formData} groups={groups} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateExam;
