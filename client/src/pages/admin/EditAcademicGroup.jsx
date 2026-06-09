import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const EditAcademicGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(defaultForm);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/academic-groups/${id}`, formData);
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
      description="Update academic group details for this institute."
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      institutes={institutes}
    />
  );
};

export default EditAcademicGroup;
