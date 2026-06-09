import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Marks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/marks");
        setMarks(data.marks);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load marks history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading marks..." />;
  return <section className="space-y-6"><PageHeader eyebrow="Teacher" title="Marks History" description="Review marks records you uploaded." /><AlertMessage tone="error" message={errorMessage} /><div className="rounded-[1.75rem] bg-white p-6 shadow-card"><p className="text-sm text-slate-600">Marks records: {marks.length}</p></div></section>;
};

export default Marks;
