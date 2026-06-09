import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LoadingBlock from "../../components/LoadingBlock";
import NoticeForm from "../../components/notices/NoticeForm";
import { noticeFormDefaults } from "../../utils/noticeOptions";

const EditNotice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(noticeFormDefaults);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: noticeData }, { data: groupData }] = await Promise.all([
          api.get(`/notices/${id}`),
          api.get("/academic-groups"),
        ]);

        setFormData({
          title: noticeData.notice.title || "",
          description: noticeData.notice.description || "",
          noticeType: noticeData.notice.noticeType || "general",
          audience: noticeData.notice.audience || "all",
          academicGroupId: noticeData.notice.academicGroupId?._id || noticeData.notice.academicGroupId || "",
          priority: noticeData.notice.priority || "normal",
          publishDate: noticeData.notice.publishDate ? noticeData.notice.publishDate.slice(0, 10) : "",
          expiryDate: noticeData.notice.expiryDate ? noticeData.notice.expiryDate.slice(0, 10) : "",
          status: noticeData.notice.status || "draft",
        });
        setAcademicGroups(groupData.academicGroups || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load notice");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

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
      await api.put(`/notices/${id}`, {
        ...formData,
        expiryDate: formData.expiryDate || null,
        academicGroupId: formData.audience === "academic_group" ? formData.academicGroupId : null,
      });
      window.alert("Notice updated successfully");
      navigate(`/admin/notices/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update notice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading notice..." />;

  return (
    <NoticeForm
      title="Edit Notice"
      description="Update the content, timing, and audience of this notice."
      formData={formData}
      academicGroups={academicGroups}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
};

export default EditNotice;
