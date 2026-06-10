import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
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

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: studentData }, { data: groupsData }] = await Promise.all([
          api.get(`/students/${id}`),
          api.get("/academic-groups"),
        ]);
        const student = studentData.student;
        setGroups(groupsData.academicGroups);
        setFormData({
          name: student.name || "",
          email: student.email || "",
          phone: student.phone || "",
          password: "",
          academicGroupId: student.academicGroupId?._id || "",
          rollNumber: student.rollNumber || "",
          admissionNumber: student.admissionNumber || "",
          registrationNumber: student.registrationNumber || "",
          dob: student.dob ? String(student.dob).slice(0, 10) : "",
          gender: student.gender || "",
          bloodGroup: student.bloodGroup || "",
          address: student.address || "",
          admissionDate: student.admissionDate ? String(student.admissionDate).slice(0, 10) : "",
          status: student.status || "active",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load student");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/students/${id}`, formData);
      window.alert("Student updated successfully");
      navigate(`/admin/students/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update student");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading student..." />;
  return <StudentForm title="Edit Student" description="Update student login account and academic profile." formData={formData} groups={groups} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditStudent;
