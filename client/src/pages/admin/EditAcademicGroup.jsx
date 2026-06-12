import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import AcademicGroupForm from "./AcademicGroupForm";
import { useAuth } from "../../context/AuthContext";
import { buildAcademicGroupPayload, defaultForm, resetStructureFields, validateAcademicGroupForm } from "./academicGroupFormUtils";

const EditAcademicGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(defaultForm);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, instsRes] = await Promise.all([
          api.get(`/academic-groups/${id}`),
          user?.role === "superadmin" ? api.get("/institutes") : Promise.resolve({ data: { institutes: [] } }),
        ]);

        const group = groupRes.data.academicGroup;
        setFormData({
          instituteId: group.instituteId?._id || group.instituteId || "",
          instituteType: group.instituteType || "",
          schoolLevel: group.schoolLevel || "",
          className: group.className || "",
          programLevel: group.programLevel || "",
          department: group.department || "",
          course: group.course || "",
          semester: group.semester || "",
          year: group.year || "",
          batch: group.batch || "",
          section: group.section || "",
          status: group.status || "active",
        });

        if (user?.role === "superadmin") {
          setInstitutes(instsRes.data.institutes.filter((inst) => inst.status === "active"));
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const instituteType =
    user?.role === "superadmin"
      ? institutes.find((inst) => inst._id === formData.instituteId)?.instituteType || formData.instituteType || ""
      : formData.instituteType || user?.institute?.instituteType || "school";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: "" }));

    if (name === "instituteId") {
      const selectedInstitute = institutes.find((inst) => inst._id === value);
      setFormData((current) => ({
        ...resetStructureFields(current, selectedInstitute?.instituteType || current.instituteType || ""),
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
      await api.put(`/academic-groups/${id}`, payload);
      window.alert("Academic group updated successfully");
      navigate(`/admin/academic-groups/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update academic group");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading academic group details..." />;
  }

  return (
    <AcademicGroupForm
      title="Edit Academic Group"
      description="Update class, semester, batch or program structure for the selected institute."
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

export default EditAcademicGroup;
