import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const { data } = await api.get("/notices/my-notices");
        setNotices(data.notices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load notices");
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, []);

  if (loading) return <LoadingBlock message="Loading notices..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Student" title="My Notices" description="Check notices shared with all students or your academic group." />
      <AlertMessage tone="error" message={errorMessage} />
      <LatestNoticesPanel notices={notices} description="Your latest published institute notices appear below." />
    </section>
  );
};

export default Notices;
