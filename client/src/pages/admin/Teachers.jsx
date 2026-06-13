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
import { getTeacherLabel, getTeacherLabelPlural } from "../../utils/instituteLabels";

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Teachers = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const singularLabel = getTeacherLabel(user);
  const pluralLabel = getTeacherLabelPlural(user);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/teachers");
      setTeachers(data.teachers);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || `Unable to load ${pluralLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleStatusToggle = async (teacher) => {
    setConfirmModal({
      type: "status",
      teacher,
      title: teacher.status === "active" ? `Deactivate ${singularLabel}?` : `Activate ${singularLabel}?`,
      message: teacher.status === "active" 
        ? `This ${singularLabel.toLowerCase()} will no longer be able to login.` 
        : `This ${singularLabel.toLowerCase()} will be able to login again.`,
    });
  };

  const handleDelete = async (teacher) => {
    setConfirmModal({
      type: "delete",
      teacher,
      title: `Delete ${singularLabel}?`,
      message: `This action will remove the ${singularLabel.toLowerCase()} record. This cannot be undone.`,
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { teacher } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = teacher.status === "active" ? "inactive" : "active";
      await api.patch(`/teachers/${teacher._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`${singularLabel} marked as ${nextStatus}`);
      setConfirmModal(null);
      fetchTeachers();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { teacher } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/teachers/${teacher._id}`);
      setMessageTone("success");
      setMessage(`${singularLabel} deleted successfully`);
      setConfirmModal(null);
      fetchTeachers();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingBlock message={`Loading ${pluralLabel.toLowerCase()}...`} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={pluralLabel}
        description={`Manage ${pluralLabel.toLowerCase()} within your institute.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" as={Link} to="/admin/bulk-import">
              Bulk Import
            </Button>
            <Button
              as={Link}
              to="/admin/teachers/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            >
              Create {singularLabel}
            </Button>
          </div>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {teachers.length === 0 ? (
        <EmptyState
          title={`No ${pluralLabel.toLowerCase()} yet`}
          description={`Register the first ${singularLabel.toLowerCase()} to manage subject allocations.`}
          actionText={`Create ${singularLabel}`}
          actionLink="/admin/teachers/create"
        />
      ) : (
        <TableShell
          headers={["Name", "Email", "Department", "Status", "Actions"]}
        >
          {teachers.map((teacher) => (
            <tr key={teacher._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(teacher.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{teacher.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{teacher.employeeId || "No ID"}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{teacher.email}</p>
                {teacher.phone && (
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{teacher.phone}</p>
                )}
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{teacher.department || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={teacher.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={teacher}
                  isActive={teacher.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={teacher.status === "active" ? () => handleStatusToggle(teacher) : undefined}
                  onActivate={teacher.status === "inactive" ? () => handleStatusToggle(teacher) : undefined}
                  onDelete={() => handleDelete(teacher)}
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
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.teacher?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Teachers;
