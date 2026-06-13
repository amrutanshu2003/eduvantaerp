import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import InstituteForm from "./InstituteForm";
import { instituteFormDefaults } from "./instituteFormDefaults";

const EditInstitute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(instituteFormDefaults);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const { data } = await api.get(`/institutes/${id}`);
        setFormData({
          name: data.institute.name || "",
          instituteCode: data.institute.instituteCode || "",
          instituteType: data.institute.instituteType || "school",
          email: data.institute.email || "",
          phone: data.institute.phone || "",
          address: data.institute.address || "",
          logo: data.institute.logo || "",
          headName: data.institute.headName || "",
          status: data.institute.status || "active",
          plan: data.institute.plan || "free",
          paymentStatus: data.institute.paymentStatus || "trial",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load institute");
      } finally {
        setLoading(false);
      }
    };

    fetchInstitute();
  }, [id]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.put(`/institutes/${id}`, formData);
      window.alert("Institute updated successfully");
      navigate(`/super-admin/institutes/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update institute");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading institute details..." />;
  }

  return (
    <InstituteForm
      title="Edit Institute"
      description="Update core institute details, subscription status and onboarding information."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      submitLabel="Save Changes"
      submittingLabel="Saving..."
    />
  );
};

export default EditInstitute;
