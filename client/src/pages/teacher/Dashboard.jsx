import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import { formatLabel } from "../../utils/formatters";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/teacher");
        setStats(data.stats);
        setLatestNotices(data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load teacher dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBlock message="Loading teacher dashboard..." />;

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      {stats ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Object.entries(stats).map(([key, value]) => <div key={key} className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{formatLabel(key)}</p><p className="mt-3 text-3xl font-semibold text-ink">{value}</p></div>)}</div> : null}
      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for teachers." />
    </section>
  );
};

export default Dashboard;
