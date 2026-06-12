import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import AcademicGroupForm from "./AcademicGroupForm";
import { useAuth } from "../../context/AuthContext";
import { buildAcademicGroupPayload, defaultForm, resetStructureFields, validateAcademicGroupForm } from "./academicGroupFormUtils";

const CreateAcademicGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(defaultForm);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(user?.role === "superadmin");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (user?.role !== "superadmin") return;
      try {
        const { data } = await api.get("/institutes");
        const activeInstitutes = data.institutes.filter((inst) => inst.status === "active");
        setInstitutes(activeInstitutes);
        if (activeInstitutes.length > 0) {
          setFormData((curr) => ({
            ...curr,
            instituteId: activeInstitutes[0]._id,
            instituteType: activeInstitutes[0].instituteType || "",
          }));
        }
      } catch (error) {
        setErrorMessage("Unable to load active institutes");
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutes();
  }, [user]);

  const instituteType =
    user?.role === "superadmin"
      ? institutes.find((inst) => inst._id === formData.instituteId)?.instituteType || formData.instituteType || ""
      : user?.institute?.instituteType || "school";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: "" }));

    if (name === "instituteId") {
      const selectedInstitute = institutes.find((inst) => inst._id === value);
      setFormData((current) => ({
        ...resetStructureFields(current, selectedInstitute?.instituteType || ""),
        instituteId: value,
        status: current.status || "active",
      }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    const nextFieldErrors = validateAcademicGroupForm({
      formData,
      instituteType,
      requiresInstitute: user?.role === "superadmin",
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("Please complete required academic structure fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildAcademicGroupPayload(formData, instituteType);
      const { data } = await api.post("/academic-groups", payload);
      window.alert("Academic group created successfully");
      navigate(`/admin/academic-groups/${data.academicGroup._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create academic group");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading active institutes..." />;
  }

  return (
    <AcademicGroupForm
      title="Create Academic Group"
      description="Configure class, semester, batch or program structure for the selected institute."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      fieldErrors={fieldErrors}
      institutes={institutes}
      instituteType={instituteType}
    />
  );
};

export default CreateAcademicGroup;
