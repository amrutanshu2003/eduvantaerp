import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { canViewHostelWorkflow } from "../../utils/hostelAccess";
import { formatDate } from "../../utils/formatters";

const HostelOutpassDetailsPage = ({ eyebrow, roleMode }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [outpass, setOutpass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/hostel-outpasses/${id}`);
        setOutpass(data.outpass);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel outpass");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const allowed =
    roleMode === "manager"
      ? canViewHostelWorkflow(user)
      : roleMode === "student"
        ? user?.role === "student"
        : user?.role === "parent";

  if (!allowed) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel outpass details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={outpass?.student?.name || "Hostel Outpass"} description="Review outpass dates, approval states, and remarks." />
      <AlertMessage tone="error" message={errorMessage} />
      {outpass ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{outpass.reason}</p><h2 className="mt-2 text-2xl font-semibold text-ink">{outpass.destination}</h2></div><StatusBadge value={outpass.finalStatus} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">From</p><p className="mt-2 font-semibold text-ink">{formatDate(outpass.fromDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">To</p><p className="mt-2 font-semibold text-ink">{formatDate(outpass.toDate)}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parent Approval</p><p className="mt-2 font-semibold text-ink">{outpass.parentApprovalStatus}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warden Approval</p><p className="mt-2 font-semibold text-ink">{outpass.wardenApprovalStatus}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hostel</p><p className="mt-2 font-semibold text-ink">{outpass.hostelAllocation?.hostelId?.hostelName || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room / Bed</p><p className="mt-2 font-semibold text-ink">{outpass.hostelAllocation?.roomId?.roomNumber || "-"} / {outpass.hostelAllocation?.bedId?.bedNumber || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Remarks</p><p className="mt-2 font-semibold text-ink">{outpass.remarks || "-"}</p></div></div></div> : null}
    </section>
  );
};

export default HostelOutpassDetailsPage;
