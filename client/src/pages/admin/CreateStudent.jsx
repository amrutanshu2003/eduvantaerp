import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import StudentForm from "./StudentForm";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  academicGroupId: "",
  rollNumber: "",
  admissionNumber: "",
  registrationNumber: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  admissionDate: "",
  status: "active",
};
const CreateStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);
  const [isPasswordManuallyEdited, setIsPasswordManuallyEdited] = useState(false);

  // Fetch academic groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await api.get("/academic-groups");
        setGroups(data.academicGroups);
      } catch (error) {
        console.error("Failed to load academic groups", error);
      }
    };
    fetchGroups();
  }, []);

  // Fetch next sequences when academicGroupId or autoGenerate changes
  useEffect(() => {
    if (!autoGenerate) return;

    const fetchSequences = async () => {
      try {
        const params = formData.academicGroupId ? { academicGroupId: formData.academicGroupId } : {};
        const { data } = await api.get("/students/next-sequences", { params });

        setFormData((current) => {
          const updated = {
            ...current,
            rollNumber: data.rollNumber,
            registrationNumber: data.registrationNumber,
            admissionNumber: data.admissionNumber,
            admissionDate: data.admissionDate,
          };

          // Recalculate email and password if name/roll number change
          const roll = data.rollNumber;
          const cleanName = current.name.toLowerCase().trim().replace(/\s+/g, "");

          if (!isEmailManuallyEdited) {
            updated.email = roll && cleanName ? `${roll}.${cleanName}@eduvanta.edu` : "";
          }
          if (!isPasswordManuallyEdited) {
            updated.password = roll || "";
          }

          return updated;
        });
      } catch (error) {
        console.error("Failed to fetch next sequences", error);
      }
    };

    fetchSequences();
  }, [formData.academicGroupId, autoGenerate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "email") {
      setIsEmailManuallyEdited(true);
    }
    if (name === "password") {
      setIsPasswordManuallyEdited(true);
    }

    setFormData((current) => {
      const updated = { ...current, [name]: value };

      if (autoGenerate && (name === "name" || name === "rollNumber")) {
        const roll = updated.rollNumber || "";
        const cleanName = updated.name.toLowerCase().trim().replace(/\s+/g, "");

        if (!isEmailManuallyEdited) {
          updated.email = roll && cleanName ? `${roll}.${cleanName}@eduvanta.edu` : "";
        }
        if (!isPasswordManuallyEdited) {
          updated.password = roll;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/students", formData);
      window.alert("Student created successfully");
      navigate(`/admin/students/${data.student._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentForm
      title="Create Student"
      description="Create a student login account and academic profile."
      formData={formData}
      groups={groups}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      autoGenerate={autoGenerate}
      onToggleAutoGenerate={() => setAutoGenerate((prev) => !prev)}
      isEmailManuallyEdited={isEmailManuallyEdited}
      isPasswordManuallyEdited={isPasswordManuallyEdited}
    />
  );
};

export default CreateStudent;
