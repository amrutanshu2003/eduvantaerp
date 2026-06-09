import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AssignmentForm from "../../components/assignments/AssignmentForm";
import LoadingBlock from "../../components/LoadingBlock";

const EditAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: assignmentData }, { data: subjectData }] = await Promise.all([
          api.get(`/assignments/${id}`),
          api.get("/subjects"),
        ]);
        const nextSubjects = subjectData.subjects || [];
        setSubjects(nextSubjects);
        const groups = nextSubjects.reduce((collection, subject) => {
          const group = subject.academicGroupId;
          if (group && !collection.find((entry) => entry._id === group._id)) collection.push(group);
          return collection;
        }, []);
        setAcademicGroups(groups);
        setFormData({
          academicGroupId: assignmentData.assignment.academicGroupId?._id || assignmentData.assignment.academicGroupId || "",
          subjectId: assignmentData.assignment.subjectId?._id || assignmentData.assignment.subjectId || "",
          title: assignmentData.assignment.title || "",
          description: assignmentData.assignment.description || "",
          dueDate: assignmentData.assignment.dueDate ? assignmentData.assignment.dueDate.slice(0, 10) : "",
          maxMarks: assignmentData.assignment.maxMarks || "",
          attachment: assignmentData.assignment.attachment || "",
          assignmentType: assignmentData.assignment.assignmentType || "assignment",
          status: assignmentData.assignment.status || "draft",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/assignments/${id}`, formData);
      window.alert("Assignment updated successfully");
      navigate(`/teacher/assignments/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) return <LoadingBlock message="Loading assignment..." />;

  return <AssignmentForm title="Edit Assignment" description="Update assignment details, due date, and publishing status." formData={formData} academicGroups={academicGroups} subjects={subjects} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditAssignment;
