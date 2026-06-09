import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
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

const EditTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data } = await api.get(`/teachers/${id}`);
        setFormData({
          name: data.teacher.name || "",
          email: data.teacher.email || "",
          phone: data.teacher.phone || "",
          password: "",
          employeeId: data.teacher.employeeId || "",
          qualification: data.teacher.qualification || "",
          experience: data.teacher.experience || "",
          department: data.teacher.department || "",
          status: data.teacher.status || "active",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load teacher");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/teachers/${id}`, formData);
      window.alert("Teacher updated successfully");
      navigate(`/admin/teachers/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update teacher");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading teacher..." />;
  return <TeacherForm title="Edit Teacher" description="Update Teacher details for this institute." formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditTeacher;
