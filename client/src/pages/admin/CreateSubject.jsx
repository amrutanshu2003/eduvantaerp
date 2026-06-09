import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SubjectForm from "./SubjectForm";

const CreateSubject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ subjectName: "", subjectCode: "", academicGroupId: "", teacherId: "", subjectType: "core", totalMarks: 100, passingMarks: 33, status: "active" });
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      const [{ data: groupsData }, { data: teachersData }] = await Promise.all([api.get("/academic-groups"), api.get("/teachers")]);
      setGroups(groupsData.academicGroups);
      setTeachers(teachersData.teachers);
    };
    loadOptions();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/subjects", formData);
      window.alert("Subject created successfully");
      navigate(`/admin/subjects/${data.subject._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create subject");
    } finally {
      setSubmitting(false);
    }
  };

  return <SubjectForm title="Create Subject" description="Create a subject and optionally assign a teacher." formData={formData} groups={groups} teachers={teachers} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateSubject;
