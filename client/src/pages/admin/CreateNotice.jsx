import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import NoticeForm from "../../components/notices/NoticeForm";
import { noticeFormDefaults } from "../../utils/noticeOptions";

const CreateNotice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(noticeFormDefaults);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const { data } = await api.get("/academic-groups");
        setAcademicGroups(data.academicGroups || []);
      } catch (error) {
        setAcademicGroups([]);
      }
    };

    loadGroups();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "audience" && value !== "academic_group" ? { academicGroupId: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        expiryDate: formData.expiryDate || null,
        academicGroupId: formData.audience === "academic_group" ? formData.academicGroupId : null,
      };

      const { data } = await api.post("/notices", payload);
      window.alert("Notice created successfully");
      navigate(`/admin/notices/${data.notice._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create notice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NoticeForm
      title="Create Notice"
      description="Share updates with the full institute or a targeted audience."
      formData={formData}
      academicGroups={academicGroups}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
};

export default CreateNotice;
