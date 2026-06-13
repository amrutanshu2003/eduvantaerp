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
import { getParentLabel, getParentLabelPlural } from "../../utils/instituteLabels";

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Parents = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const singularLabel = getParentLabel(user);
  const pluralLabel = getParentLabelPlural(user);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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
    setConfirmModal({
      type: "status",
      parent,
      title: parent.status === "active" ? `Deactivate ${singularLabel}?` : `Activate ${singularLabel}?`,
      message: parent.status === "active" 
        ? `This ${singularLabel.toLowerCase()} will no longer be able to login.` 
        : `This ${singularLabel.toLowerCase()} will be able to login again.`,
    });
  };

  const handleDelete = async (parent) => {
    setConfirmModal({
      type: "delete",
      parent,
      title: `Delete ${singularLabel}?`,
      message: `This action will remove the ${singularLabel.toLowerCase()} record. This cannot be undone.`,
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { parent } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = parent.status === "active" ? "inactive" : "active";
      await api.patch(`/parents/${parent._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`${singularLabel} marked as ${nextStatus}`);
      setConfirmModal(null);
      fetchParents();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { parent } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/parents/${parent._id}`);
      setMessageTone("success");
      setMessage(`${singularLabel} deleted successfully`);
      setConfirmModal(null);
      fetchParents();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingBlock message={`Loading ${pluralLabel.toLowerCase()}...`} />;

  return (
    <section className="space-y-6">
      <PageHeader 
        eyebrow="Admin" 
        title={pluralLabel} 
        description={`Manage ${pluralLabel.toLowerCase()} linked to students in this institute.`} 
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" as={Link} to="/admin/bulk-import">
              Bulk Import
            </Button>
            <Button
              as={Link}
              to="/admin/parents/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            >
              Create {singularLabel}
            </Button>
          </div>
        } 
      />
      <AlertMessage tone={messageTone} message={message} />
      {parents.length === 0 ? (
        <EmptyState
          title={`No ${pluralLabel.toLowerCase()} yet`}
          description={`Create the first ${singularLabel.toLowerCase()} record for this institute to link children.`}
          actionText={`Create ${singularLabel}`}
          actionLink="/admin/parents/create"
        />
      ) : (
        <TableShell
          headers={["Name", "Relation", "Linked Students", "Status", "Actions"]}
        >
          {parents.map((parent) => (
            <tr key={parent._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(parent.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{parent.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{parent.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{parent.relation || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{parent.linkedStudentIds?.length || 0}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={parent.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={parent}
                  isActive={parent.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={parent.status === "active" ? () => handleStatusToggle(parent) : undefined}
                  onActivate={parent.status === "inactive" ? () => handleStatusToggle(parent) : undefined}
                  onDelete={() => handleDelete(parent)}
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
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.parent?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Parents;
