import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import SubmissionForm from "../../components/assignments/SubmissionForm";
import { assignmentSubmissionDefaults } from "../../utils/assignmentOptions";

const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [formData, setFormData] = useState(assignmentSubmissionDefaults);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/assignments/my-assignments");
        const current = (data.assignments || []).find((entry) => entry._id === id);
        setAssignment(current || null);
        setFormData({ answerText: current?.submission?.answerText || "", attachment: current?.submission?.attachment || "" });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assignment submission form");
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
      await api.post(`/assignments/${id}/submit`, formData);
      window.alert("Assignment submitted successfully");
      navigate(`/student/assignments/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading submission form..." />;

  return <SubmissionForm title="Submit Assignment" description={`Submit your work for ${assignment?.title || "this assignment"}.`} formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default SubmitAssignment;
