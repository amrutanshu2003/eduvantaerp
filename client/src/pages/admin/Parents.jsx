import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getParentLabel, getParentLabelPlural } from "../../utils/instituteLabels";

const Parents = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const singularLabel = getParentLabel(user);
  const pluralLabel = getParentLabelPlural(user);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchParents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/parents");
      setParents(data.parents);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load parent records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleStatusToggle = async (parent) => {
    const status = parent.status === "active" ? "inactive" : "active";
    await api.patch(`/parents/${parent._id}/status`, { status });
    setMessageTone("success");
    setMessage(`${singularLabel} marked as ${status}`);
    fetchParents();
  };

  const handleDelete = async (parent) => {
    if (!(await window.confirm(`Delete this ${singularLabel.toLowerCase()}?`))) return;
    await api.delete(`/parents/${parent._id}`);
    setMessageTone("success");
    setMessage(`${singularLabel} deleted successfully`);
    fetchParents();
  };

  if (loading) return <LoadingBlock message={`Loading ${pluralLabel.toLowerCase()}...`} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title={pluralLabel} description={`Manage ${pluralLabel.toLowerCase()} linked to students in this institute.`} actions={<div className="flex flex-wrap gap-3"><Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Bulk Import</Link><Link to="/admin/parents/create" style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Create {singularLabel}</Link></div>} />
      <AlertMessage tone={messageTone} message={message} />
      {parents.length === 0 ? (
        <EmptyState title={`No ${pluralLabel.toLowerCase()} yet`} description={`Create the first ${singularLabel.toLowerCase()} record for this institute.`} />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4 font-medium">Name</th><th className="px-6 py-4 font-medium">Relation</th><th className="px-6 py-4 font-medium">Linked Students</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent._id} className="border-t border-slate-100">
                    <td className="px-6 py-4"><p className="font-medium text-ink">{parent.name}</p><p className="text-xs text-slate-500">{parent.email}</p></td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{parent.relation || "-"}</td>
                    <td className="px-6 py-4 text-slate-600">{parent.linkedStudentIds?.length || 0}</td>
                    <td className="px-6 py-4"><StatusBadge value={parent.status} /></td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-2"><Link to={`/admin/parents/${parent._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`/admin/parents/${parent._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><Link to={`/admin/parents/${parent._id}/link-students`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Link Students</Link><button type="button" onClick={() => handleStatusToggle(parent)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{parent.status === "active" ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => handleDelete(parent)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">Delete</button></div></td>
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

export default Parents;
