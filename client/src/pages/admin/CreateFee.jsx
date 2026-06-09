import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import FeeForm from "../../components/fees/FeeForm";
import { feeFormDefaults } from "../../utils/feeOptions";

const CreateFee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(feeFormDefaults);
  const [students, setStudents] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [{ data: studentData }, { data: groupData }] = await Promise.all([
          api.get("/students"),
          api.get("/academic-groups"),
        ]);
        setStudents(studentData.students || []);
        setAcademicGroups(groupData.academicGroups || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load fee form options");
      }
    };

    loadOptions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await api.post("/fees", {
        ...formData,
        paymentDate: formData.paymentDate || null,
      });
      window.alert("Fee created successfully");
      navigate(`/admin/fees/${data.fee._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create fee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FeeForm
      title="Create Fee"
      description="Assign a fee record to a single student and track payment status from day one."
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

export default CreateFee;
