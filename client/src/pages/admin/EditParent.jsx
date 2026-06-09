import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import ParentForm from "./ParentForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  relation: "",
  linkedStudentIds: [],
  address: "",
  status: "active",
};

const EditParent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: parentData }, { data: studentsData }] = await Promise.all([
          api.get(`/parents/${id}`),
          api.get("/students"),
        ]);
        setStudents(studentsData.students);
        setFormData({
          name: parentData.parent.name || "",
          email: parentData.parent.email || "",
          phone: parentData.parent.phone || "",
          password: "",
          relation: parentData.parent.relation || "",
          linkedStudentIds: (parentData.parent.linkedStudentIds || []).map((student) => student._id || student),
          address: parentData.parent.address || "",
          status: parentData.parent.status || "active",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load parent");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (event) => {
    if (event.target.name === "linkedStudentIds") {
      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
      setFormData((current) => ({ ...current, linkedStudentIds: values }));
      return;
    }
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/parents/${id}`, formData);
      window.alert("Parent updated successfully");
      navigate(`/admin/parents/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update parent");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading parent..." />;
  return <ParentForm title="Edit Parent" description="Update Parent details and student links." formData={formData} students={students} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditParent;
