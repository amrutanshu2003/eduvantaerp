import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const Staff = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
            <tr key={member._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
              <td className="px-6 py-4">
                <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{String(member.designation || "-").replaceAll("_", " ")}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{member.department || "-"}</td>
              <td className="px-6 py-4"><StatusBadge value={member.status} /></td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" as={Link} to={`/admin/staff/${member._id}`}>
                    View
                  </Button>
                  <Button variant="secondary" size="sm" as={Link} to={`/admin/staff/${member._id}/edit`}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" as={Link} to={`/admin/staff/${member._id}/permissions`}>
                    Permissions
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleStatusToggle(member)}>
                    {member.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(member)}>
                    Delete
                  </Button>
                </div>
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
