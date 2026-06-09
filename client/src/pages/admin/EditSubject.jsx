import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import SubjectForm from "./SubjectForm";

const EditSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ subjectName: "", subjectCode: "", academicGroupId: "", teacherId: "", subjectType: "core", totalMarks: 100, passingMarks: 33, status: "active" });
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: subjectData }, { data: groupsData }, { data: teachersData }] = await Promise.all([api.get(`/subjects/${id}`), api.get("/academic-groups"), api.get("/teachers")]);
        const subject = subjectData.subject;
        setGroups(groupsData.academicGroups);
        setTeachers(teachersData.teachers);
        setFormData({
          subjectName: subject.subjectName || "",
          subjectCode: subject.subjectCode || "",
          academicGroupId: subject.academicGroupId?._id || "",
          teacherId: subject.teacherId?._id || "",
          subjectType: subject.subjectType || "core",
          totalMarks: subject.totalMarks || 100,
          passingMarks: subject.passingMarks || 33,
          status: subject.status || "active",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subject");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/subjects/${id}`, formData);
      window.alert("Subject updated successfully");
      navigate(`/admin/subjects/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update subject");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading subject..." />;
  return <SubjectForm title="Edit Subject" description="Update subject details and teacher assignment." formData={formData} groups={groups} teachers={teachers} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditSubject;
