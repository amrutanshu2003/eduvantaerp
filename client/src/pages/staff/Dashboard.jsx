import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LatestNoticesPanel from "../../components/LatestNoticesPanel";
import LoadingBlock from "../../components/LoadingBlock";
import { useAuth } from "../../context/AuthContext";
import { formatLabel } from "../../utils/formatters";
import { canManageHostel, isHostelSecurityUser } from "../../utils/hostelAccess";
import { canManageTransport, isDriverUser } from "../../utils/transportAccess";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get("/phase4-dashboard/staff");
        setStats(data.stats);
        setLatestNotices(data.latestNotices || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load staff dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <LoadingBlock message="Loading staff dashboard..." />;
  const visibleStats = stats
    ? Object.entries(stats).filter(
        ([key]) =>
          key !== "totalStaff" ||
          !(
            user?.designation === "librarian" ||
            (user?.permissions || []).includes("library.manage") ||
            canManageTransport(user) ||
            isDriverUser(user) ||
            canManageHostel(user) ||
            isHostelSecurityUser(user)
          )
      )
    : [];

  return (
    <section className="space-y-6">
      <AlertMessage tone="error" message={errorMessage} />
      {visibleStats.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visibleStats.map(([key, value]) => <div key={key} className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{formatLabel(key)}</p><p className="mt-3 text-3xl font-semibold text-ink">{value}</p></div>)}</div> : null}
      <LatestNoticesPanel notices={latestNotices} description="Latest published notices for staff members." />
    </section>
  );
};

export default Dashboard;
