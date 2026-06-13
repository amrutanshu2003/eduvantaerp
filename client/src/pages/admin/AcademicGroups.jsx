import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getAcademicGroupLabel, getInstituteType } from "../../utils/instituteLabels";

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const AcademicGroups = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const instituteType = getInstituteType(user);
  const [groups, setGroups] = useState([]);
  const [academicSettings, setAcademicSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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
    setConfirmModal({
      type: "status",
      group,
      title: group.status === "active" ? `Deactivate ${academicGroupLabel}?` : `Activate ${academicGroupLabel}?`,
      message: group.status === "active" 
        ? `This ${academicGroupLabel.toLowerCase()} will no longer be accessible.` 
        : `This ${academicGroupLabel.toLowerCase()} will be accessible again.`,
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { group } = confirmModal;
    try {
      setActionLoading(true);
      const status = group.status === "active" ? "inactive" : "active";
      await api.patch(`/academic-groups/${group._id}/status`, { status });
      setMessageTone("success");
      setMessage(`Academic group marked as ${status}`);
      setConfirmModal(null);
      fetchGroups();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (group) => {
    setConfirmModal({
      type: "delete",
      group,
      title: `Delete ${academicGroupLabel}?`,
      message: `This action will remove the ${academicGroupLabel.toLowerCase()} record. This cannot be undone.`,
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { group } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/academic-groups/${group._id}`);
      setMessageTone("success");
      setMessage("Academic group deleted successfully");
      setConfirmModal(null);
      fetchGroups();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(false);
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
          description={`Create the first ${academicGroupLabel.toLowerCase()} to organize students and classes.`}
          actionText={`Create ${academicGroupLabel}`}
          actionLink="/admin/academic-groups/create"
        />
      ) : (
        <TableShell
          headers={["Name", ...listFields.sort((a, b) => a.order - b.order).map((f) => f.label), subGroupLabel, "Status", "Actions"]}
        >
          {groups.map((group) => (
            <tr key={group._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(getGroupDisplayName(group))}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{getGroupDisplayName(group)}</p>
                  </div>
                </div>
              </td>
              {listFields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <td key={field.fieldKey} className="px-6 py-4">
                    <p className={isDark ? "text-slate-300" : "text-slate-700"}>{getFieldValue(group, field)}</p>
                  </td>
                ))}
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{group.section || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={group.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={group}
                  isActive={group.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={group.status === "active" ? () => handleStatusToggle(group) : undefined}
                  onActivate={group.status === "inactive" ? () => handleStatusToggle(group) : undefined}
                  onDelete={() => handleDelete(group)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "delete" ? confirmDelete : confirmStatusToggle}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.group?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default AcademicGroups;
