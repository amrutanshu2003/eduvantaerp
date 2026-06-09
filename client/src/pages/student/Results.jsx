import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const Results = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/results/my-result");
        setResult(data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load results");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading your results..." />;
  return <section className="space-y-6"><PageHeader eyebrow="Student" title="My Results" description="Review published marks and overall result summary." /><AlertMessage tone="error" message={errorMessage} />{result ? <div className="grid gap-4 md:grid-cols-5">{["totalObtained","totalPossible","percentage","grade","result"].map((key) => <div key={key} className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{key}</p><p className="mt-3 font-semibold text-ink">{result.summary[key]}{key==="percentage"?"%":""}</p></div>)}</div> : null}</section>;
};

export default Results;
