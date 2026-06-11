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
  const [academicSettings, setAcademicSettings] = useState(null);
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

  const fetchAcademicSettings = async () => {
    try {
      const { data } = await api.get("/academic-settings");
      setAcademicSettings(data.academicSettings);
    } catch (error) {
      console.error("Failed to load academic settings:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchAcademicSettings();
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
    if (!(await window.confirm("Delete this academic group?"))) {
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

  // Get dynamic fields that should be shown in list
  const listFields = academicSettings?.fields?.filter((f) => f.showInList && f.status === "active") || [];

  // Get labels from academic settings
  const academicGroupLabel = academicSettings?.academicGroupLabel || "Class";
  const subGroupLabel = academicSettings?.subGroupLabel || "Section";

  const getGroupDisplayName = (group) => {
    // Try to construct name from dynamic fields first
    if (group.dynamicFields && Object.keys(group.dynamicFields).length > 0) {
      const keys = Object.keys(group.dynamicFields);
      return keys.map((key) => group.dynamicFields[key]).filter(Boolean).join(" - ");
    }
    
    // Fallback to old fields for backward compatibility
    if (["college", "university"].includes(group.instituteType)) {
      return `${group.department || ""} - ${group.course || ""}`.trim() || "N/A";
    }
    return `${group.className || ""} (${group.schoolLevel || "N/A"})`.trim() || "N/A";
  };

  const getFieldValue = (group, field) => {
    // Check dynamic fields first
    if (group.dynamicFields && group.dynamicFields[field.fieldKey]) {
      return group.dynamicFields[field.fieldKey];
    }
    // Fallback to old field
    if (group[field.fieldKey]) {
      return group[field.fieldKey];
    }
    return "-";
  };

  if (loading) {
    return <LoadingBlock message="Loading academic groups..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={academicGroupLabel + "s"}
        description="Manage institute-specific academic structures with full data isolation."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
              Bulk Import
            </Link>
            <Link
              to="/admin/academic-groups/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Create {academicGroupLabel}
            </Link>
          </div>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {groups.length === 0 ? (
        <EmptyState
          title={`No ${academicGroupLabel.toLowerCase()}s yet`}
          description="Create the first academic group for this institute."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  {listFields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <th key={field.fieldKey} className="px-6 py-4 font-medium">
                        {field.label}
                      </th>
                    ))}
                  <th className="px-6 py-4 font-medium">{subGroupLabel}</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-4 font-medium text-ink dark:text-slate-200">
                      {getGroupDisplayName(group)}
                    </td>
                    {listFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <td key={field.fieldKey} className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {getFieldValue(group, field)}
                        </td>
                      ))}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group.section || "-"}</td>
                    <td className="px-6 py-4"><StatusBadge value={group.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/academic-groups/${group._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          View
                        </Link>
                        <Link to={`/admin/academic-groups/${group._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          Edit
                        </Link>
                        <button type="button" onClick={() => handleStatusToggle(group)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                          {group.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button type="button" onClick={() => handleDelete(group)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-900 dark:text-rose-400">
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
