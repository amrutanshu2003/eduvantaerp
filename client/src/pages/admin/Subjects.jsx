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
import { getSubjectLabelPlural, getInstituteType } from "../../utils/instituteLabels";

const Subjects = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";
  const instituteType = getInstituteType(user);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data } = await api.get("/subjects");
        setSubjects(data.subjects);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load subjects");
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, []);

  const handleDelete = async (subject) => {
    setConfirmModal({
      type: "delete",
      subject,
      title: "Delete Subject?",
      message: "This action will remove the subject record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { subject } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/subjects/${subject._id}`);
      setSubjects((current) => current.filter((s) => s._id !== subject._id));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete subject");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading subjects..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={getSubjectLabelPlural(user)}
        description={`Manage subjects, ${["college", "university"].includes(instituteType) ? "academic group" : "class"} mapping and faculty assignment.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/bulk-import" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Bulk Import
            </Link>
            <Link
              to="/admin/subjects/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white"
            >
              Create Subject
            </Link>
          </div>
        }
      />
      <AlertMessage tone="error" message={errorMessage} />
      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Create the first subject for this institute to map with classes and assign teachers."
          actionText="Create Subject"
          actionLink="/admin/subjects/create"
        />
      ) : (
        <TableShell
          headers={["Subject", ["college", "university"].includes(instituteType) ? "Academic Group" : "Class", "Teacher", "Status", "Actions"]}
        >
          {subjects.map((subject) => (
            <tr key={subject._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{subject.subjectName}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subject.subjectCode}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{subject.academicGroupId?.className || subject.academicGroupId?.department || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{subject.teacherId?.name || "Unassigned"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={subject.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={subject}
                  isActive={subject.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(subject)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmDelete}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </section>
  );
};

export default Subjects;
