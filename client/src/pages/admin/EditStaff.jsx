import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import StaffForm from "./StaffForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  staffId: "",
  designation: "",
  department: "",
  joiningDate: "",
  salary: "",
  address: "",
  permissions: "",
  status: "active",
};

const EditStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await api.get(`/staff/${id}`);
        setFormData({
          name: data.staff.name || "",
          email: data.staff.email || "",
          phone: data.staff.phone || "",
          password: "",
          staffId: data.staff.staffId || "",
          designation: data.staff.designation || "",
          department: data.staff.department || "",
          joiningDate: data.staff.joiningDate ? String(data.staff.joiningDate).slice(0, 10) : "",
          salary: data.staff.salary || "",
          address: data.staff.address || "",
          permissions: (data.staff.permissions || []).join(", "),
          status: data.staff.status || "active",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load staff");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.put(`/staff/${id}`, {
        ...formData,
        permissions: formData.permissions.split(",").map((value) => value.trim()).filter(Boolean),
      });
      window.alert("Staff updated successfully");
      navigate(`/admin/staff/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading staff..." />;
  return <StaffForm title="Edit Staff" description="Update staff details, department and permission values." formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default EditStaff;
