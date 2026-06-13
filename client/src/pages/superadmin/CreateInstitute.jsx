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
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "instituteCode") {
      setIsCodeManuallyEdited(true);
      setFormData((current) => ({ ...current, [name]: value }));
    } else if (name === "name") {
      setFormData((current) => {
        const nextData = { ...current, [name]: value };
        if (!isCodeManuallyEdited) {
          // Auto-suggest code: uppercase alphanumeric, max 10 chars
          nextData.instituteCode = value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10);
        }
        return nextData;
      });
    } else {
      setFormData((current) => ({ ...current, [name]: value }));
    }
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
      description="Create a new school, college, or university and keep the record ready for institute-level admin onboarding."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      submitLabel="Create Institute"
      submittingLabel="Creating..."
    />
  );
};

export default CreateInstitute;
