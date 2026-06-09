import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ParentForm from "./ParentForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  relation: "",
  linkedStudentIds: [],
  address: "",
  status: "active",
};

const CreateParent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await api.get("/students");
      setStudents(data.students);
    };
    fetchStudents();
  }, []);

  const handleChange = (event) => {
    if (event.target.name === "linkedStudentIds") {
      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
      setFormData((current) => ({ ...current, linkedStudentIds: values }));
      return;
    }
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/parents", formData);
      window.alert("Parent created successfully");
      navigate(`/admin/parents/${data.parent._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create parent");
    } finally {
      setSubmitting(false);
    }
  };

  return <ParentForm title="Create Parent" description="Create a Parent account and link it with one or more students." formData={formData} students={students} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateParent;
