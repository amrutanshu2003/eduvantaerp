import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import InstituteForm from "./InstituteForm";
import { instituteFormDefaults } from "./instituteFormDefaults";

const CreateInstitute = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(instituteFormDefaults);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await api.post("/institutes", formData);
      window.alert("Institute created successfully");
      navigate(`/super-admin/institutes/${data.institute._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create institute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InstituteForm
      title="Create Institute"
      description="Create a new school or college and keep the record ready for institute-level admin onboarding."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      submitLabel="Create Institute"
    />
  );
};

export default CreateInstitute;
