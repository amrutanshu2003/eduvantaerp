import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import ExamForm from "./ExamForm";

const EditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ examName: "", examType: "unit_test", academicGroupId: "", startDate: "", endDate: "", status: "draft" });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: examData }, { data: groupsData }] = await Promise.all([api.get(`/exams/${id}`), api.get("/academic-groups")]);
        const exam = examData.exam;
        setGroups(groupsData.academicGroups);
        setFormData({
          examName: exam.examName || "",
          examType: exam.examType || "unit_test",
          academicGroupId: exam.academicGroupId?._id || "",
          startDate: String(exam.startDate).slice(0, 10),
          endDate: String(exam.endDate).slice(0, 10),
          status: exam.status || "draft",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load exam");
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
      await api.put(`/exams/${id}`, formData);
      window.alert("Exam updated successfully");
      navigate(`/admin/exams/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update exam");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading exam..." />;
  return <ExamForm title="Edit Exam" description="Update exam type, dates and status." formData={formData} groups={groups} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditExam;
