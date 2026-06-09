import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import AcademicGroupForm from "./AcademicGroupForm";
import { useAuth } from "../../context/AuthContext";

const defaultForm = {
  instituteId: "",
  schoolLevel: "",
  className: "",
  programLevel: "",
  department: "",
  course: "",
  semester: "",
  year: "",
  batch: "",
  section: "",
  status: "active",
};

const CreateAcademicGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(defaultForm);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(user?.role === "superadmin");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (user?.role !== "superadmin") return;
      try {
        const { data } = await api.get("/institutes");
        const activeInstitutes = data.institutes.filter((inst) => inst.status === "active");
        setInstitutes(activeInstitutes);
        if (activeInstitutes.length > 0) {
          setFormData((curr) => ({ ...curr, instituteId: activeInstitutes[0]._id }));
        }
      } catch (error) {
        setErrorMessage("Unable to load active institutes");
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutes();
  }, [user]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await api.post("/academic-groups", formData);
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
      description="Add a new academic structure for this institute."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      institutes={institutes}
    />
  );
};

export default CreateAcademicGroup;
