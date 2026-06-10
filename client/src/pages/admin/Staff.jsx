import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const Staff = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/staff");
      setStaffMembers(data.staff);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStatusToggle = async (member) => {
    const status = member.status === "active" ? "inactive" : "active";
    await api.patch(`/staff/${member._id}/status`, { status });
    setMessageTone("success");
    setMessage(`Staff marked as ${status}`);
    fetchStaff();
  };

  const handleDelete = async (member) => {
    if (!window.confirm("Delete this staff member?")) return;
    await api.delete(`/staff/${member._id}`);
    setMessageTone("success");
    setMessage("Staff deleted successfully");
    fetchStaff();
  };

  if (loading) return <LoadingBlock message="Loading staff..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Staff" description="Manage institute staff accounts and permissions." actions={<div className="flex flex-wrap gap-3"><Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Bulk Import</Link><Link to="/admin/staff/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Create Staff</Link></div>} />
      <AlertMessage tone={messageTone} message={message} />
      {staffMembers.length === 0 ? (
        <EmptyState title="No staff yet" description="Create the first staff record for this institute." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4 font-medium">Name</th><th className="px-6 py-4 font-medium">Designation</th><th className="px-6 py-4 font-medium">Department</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
              <tbody>
                {staffMembers.map((member) => (
                  <tr key={member._id} className="border-t border-slate-100">
                    <td className="px-6 py-4"><p className="font-medium text-ink">{member.name}</p><p className="text-xs text-slate-500">{member.email}</p></td>
                    <td className="px-6 py-4 text-slate-600">{String(member.designation || "-").replaceAll("_", " ")}</td>
                    <td className="px-6 py-4 text-slate-600">{member.department || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge value={member.status} /></td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-2"><Link to={`/admin/staff/${member._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`/admin/staff/${member._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><Link to={`/admin/staff/${member._id}/permissions`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Permissions</Link><button type="button" onClick={() => handleStatusToggle(member)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{member.status === "active" ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => handleDelete(member)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default Staff;
