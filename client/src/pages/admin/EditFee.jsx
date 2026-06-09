import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import FeeForm from "../../components/fees/FeeForm";
import LoadingBlock from "../../components/LoadingBlock";

const EditFee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [students, setStudents] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: feeData }, { data: studentData }, { data: groupData }] = await Promise.all([
          api.get(`/fees/${id}`),
          api.get("/students"),
          api.get("/academic-groups"),
        ]);
        setStudents(studentData.students || []);
        setAcademicGroups(groupData.academicGroups || []);
        setFormData({
          studentId: feeData.fee.studentId?._id || feeData.fee.studentId || "",
          academicGroupId: feeData.fee.academicGroupId?._id || feeData.fee.academicGroupId || "",
          feeType: feeData.fee.feeType || "tuition",
          title: feeData.fee.title || "",
          description: feeData.fee.description || "",
          amount: feeData.fee.amount ?? "",
          discount: feeData.fee.discount ?? 0,
          fine: feeData.fee.fine ?? 0,
          paidAmount: feeData.fee.paidAmount ?? 0,
          dueDate: feeData.fee.dueDate ? feeData.fee.dueDate.slice(0, 10) : "",
          paymentDate: feeData.fee.paymentDate ? feeData.fee.paymentDate.slice(0, 10) : "",
          paymentMethod: feeData.fee.paymentMethod || "none",
          transactionId: feeData.fee.transactionId || "",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load fee");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.put(`/fees/${id}`, {
        ...formData,
        paymentDate: formData.paymentDate || null,
      });
      window.alert("Fee updated successfully");
      navigate(`/admin/fees/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update fee");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) return <LoadingBlock message="Loading fee..." />;

  return (
    <FeeForm
      title="Edit Fee"
      description="Update dues, discounts, fine, and payment metadata for this student fee."
      formData={formData}
      students={students}
      academicGroups={academicGroups}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
};

export default EditFee;
