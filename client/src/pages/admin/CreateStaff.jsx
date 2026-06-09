import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
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
  permissions: "fees.view,ui.customize",
  status: "active",
};

const CreateStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/staff", {
        ...formData,
        permissions: formData.permissions.split(",").map((value) => value.trim()).filter(Boolean),
      });
      window.alert("Staff created successfully");
      navigate(`/admin/staff/${data.staff._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create staff");
    } finally {
      setSubmitting(false);
    }
  };

  return <StaffForm title="Create Staff" description="Create a staff account with department and permission details." formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateStaff;
