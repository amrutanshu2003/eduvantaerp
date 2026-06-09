import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import StudentForm from "./StudentForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  academicGroupId: "",
  rollNumber: "",
  admissionNumber: "",
  registrationNumber: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  admissionDate: "",
  status: "active",
};

const CreateStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await api.get("/academic-groups");
      setGroups(data.academicGroups);
    };
    fetchGroups();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/students", formData);
      window.alert("Student created successfully");
      navigate(`/admin/students/${data.student._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create student");
    } finally {
      setSubmitting(false);
    }
  };

  return <StudentForm title="Create Student" description="Create a student login account and academic profile." formData={formData} groups={groups} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateStudent;
