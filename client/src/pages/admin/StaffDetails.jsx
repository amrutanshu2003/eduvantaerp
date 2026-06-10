import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import UserPasswordResetModal from "../../components/UserPasswordResetModal";

const StaffDetails = () => {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await api.get(`/staff/${id}`);
        setStaff(data.staff);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load staff");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading staff details..." />;
  if (!staff) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Staff" title={staff.name} description="Review staff profile, designation and permissions." actions={<div className="flex flex-wrap gap-3"><button type="button" onClick={() => setShowResetModal(true)} className="rounded-full border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700">Reset Password</button><Link to={`/admin/staff/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit</Link><Link to={`/admin/staff/${id}/permissions`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Permissions</Link></div>} />
      {message ? <AlertMessage tone="success" message={message} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Designation</p><p className="mt-3 font-semibold text-ink">{String(staff.designation || "-").replaceAll("_", " ")}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Department</p><p className="mt-3 font-semibold text-ink">{staff.department || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Permissions</p><p className="mt-3 font-semibold text-ink">{staff.permissions?.length || 0}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={staff.status} /></div></div>
      </div>
      <UserPasswordResetModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        targetId={staff._id}
        targetRole="staff"
        targetLabel={staff.name}
        onSuccess={setMessage}
      />
    </section>
  );
};

export default StaffDetails;
