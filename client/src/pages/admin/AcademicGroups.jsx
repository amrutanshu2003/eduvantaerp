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
import { getAcademicGroupLabel, getInstituteType } from "../../utils/instituteLabels";

const AcademicGroups = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const instituteType = getInstituteType(user);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/academic-groups");
      setGroups(data.academicGroups);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load academic groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleStatusToggle = async (group) => {
    try {
      const status = group.status === "active" ? "inactive" : "active";
      await api.patch(`/academic-groups/${group._id}/status`, { status });
      setMessageTone("success");
      setMessage(`Academic group marked as ${status}`);
      fetchGroups();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm("Delete this academic group?")) {
      return;
    }

    try {
      await api.delete(`/academic-groups/${group._id}`);
      setMessageTone("success");
      setMessage("Academic group deleted successfully");
      fetchGroups();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Delete failed");
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading academic groups..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={getAcademicGroupLabel(user)}
        description="Manage institute-specific academic structures with full data isolation."
        actions={
          <Link
            to="/admin/academic-groups/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create {instituteType === "college" ? "Academic Group" : "Class"}
          </Link>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {groups.length === 0 ? (
        <EmptyState
          title={`No ${getAcademicGroupLabel(user).toLowerCase()} yet`}
          description="Create the first academic group for this institute."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Section</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group._id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-ink">
                      {group.instituteType === "college"
                        ? `${group.department} - ${group.course}`
                        : `${group.className} (${group.schoolLevel || "N/A"})`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{group.section || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge value={group.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/academic-groups/${group._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          View
                        </Link>
                        <Link to={`/admin/academic-groups/${group._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          Edit
                        </Link>
                        <button type="button" onClick={() => handleStatusToggle(group)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          {group.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button type="button" onClick={() => handleDelete(group)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
                          Delete
                        </button>
                      </div>
                    </td>
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

export default AcademicGroups;
