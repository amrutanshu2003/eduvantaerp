import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const SubjectDetails = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/subjects/${id}`);
        setSubject(data.subject);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subject");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading subject details..." />;
  if (!subject) return <AlertMessage tone="error" message={errorMessage} />;
  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title={subject.subjectName} description="Review your assigned subject and academic group." /></section>;
};

export default SubjectDetails;
