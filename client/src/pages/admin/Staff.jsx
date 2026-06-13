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
import { useUISettings } from "../../context/UISettingsContext";

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Staff = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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
    setConfirmModal({
      type: "status",
      member,
      title: member.status === "active" ? "Deactivate Staff?" : "Activate Staff?",
      message: member.status === "active" 
        ? "This staff member will no longer be able to login." 
        : "This staff member will be able to login again.",
    });
  };

  const handleDelete = async (member) => {
    setConfirmModal({
      type: "delete",
      member,
      title: "Delete Staff?",
      message: "This action will remove the staff record. This cannot be undone.",
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { member } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = member.status === "active" ? "inactive" : "active";
      await api.patch(`/staff/${member._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Staff marked as ${nextStatus}`);
      setConfirmModal(null);
      fetchStaff();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { member } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/staff/${member._id}`);
      setMessageTone("success");
      setMessage("Staff deleted successfully");
      setConfirmModal(null);
      fetchStaff();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading staff..." />;

  return (
    <section className="space-y-6">
      <PageHeader 
        eyebrow="Admin" 
        title="Staff" 
        description="Manage institute staff accounts and permissions." 
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" as={Link} to="/admin/bulk-import">
              Bulk Import
            </Button>
            <Button
              as={Link}
              to="/admin/staff/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            >
              Create Staff
            </Button>
          </div>
        } 
      />
      <AlertMessage tone={messageTone} message={message} />
      {staffMembers.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Create the first staff record for this institute to manage roles and operations."
          actionText="Create Staff"
          actionLink="/admin/staff/create"
        />
      ) : (
        <TableShell
          headers={["Name", "Designation", "Department", "Status", "Actions"]}
        >
          {staffMembers.map((member) => (
            <tr key={member._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{member.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{member.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{String(member.designation || "-").replaceAll("_", " ")}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{member.department || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={member.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={member}
                  isActive={member.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={member.status === "active" ? () => handleStatusToggle(member) : undefined}
                  onActivate={member.status === "inactive" ? () => handleStatusToggle(member) : undefined}
                  onDelete={() => handleDelete(member)}
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
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.member?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Staff;
