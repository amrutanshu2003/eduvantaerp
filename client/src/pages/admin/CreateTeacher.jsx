import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import TeacherForm from "./TeacherForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  employeeId: "",
  qualification: "",
  experience: "",
  department: "",
  status: "active",
};

const CreateTeacher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/teachers", formData);
      window.alert("Teacher created successfully");
      navigate(`/admin/teachers/${data.teacher._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return <TeacherForm title="Create Teacher" description="Create a Teacher account for this institute." formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateTeacher;
