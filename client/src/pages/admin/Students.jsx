import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { Button, TableShell, ConfirmModal, Input, Select } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const Students = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "all", academicGroupId: "all" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: studentsData }, { data: groupsData }] = await Promise.all([
        api.get("/students", { params: filters }),
        api.get("/academic-groups"),
      ]);
      setStudents(studentsData.students);
      setGroups(groupsData.academicGroups);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSearch = (event) => {
    event.preventDefault();
    fetchData();
  };

  const handleStatusToggle = async (student) => {
    setConfirmModal({
      type: "status",
      student,
      title: student.status === "active" ? "Deactivate Student?" : "Activate Student?",
      message: student.status === "active" 
        ? "This student will no longer be able to login." 
        : "This student will be able to login again.",
    });
  };

  const handleDelete = async (student) => {
    setConfirmModal({
      type: "delete",
      student,
      title: "Delete Student?",
      message: "This action will remove the student record. This cannot be undone.",
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { student } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = student.status === "active" ? "inactive" : "active";
      await api.patch(`/students/${student._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Student marked as ${nextStatus}`);
      setConfirmModal(null);
      fetchData();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { student } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/students/${student._id}`);
      setMessageTone("success");
      setMessage("Student deleted successfully");
      setConfirmModal(null);
      fetchData();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading students..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Students"
        description="Manage student accounts, profiles and academic group assignments."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" as={Link} to="/admin/bulk-import">
              Bulk Import
            </Button>
            <Button
              as={Link}
              to="/admin/students/create"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            >
              Create Student
            </Button>
          </div>
        }
      />
      <AlertMessage tone={messageTone} message={message} />
      <form onSubmit={handleSearch} className={`grid gap-4 rounded-[1.75rem] p-6 shadow-card md:grid-cols-4 ${resolvedTheme === "dark" ? "bg-slate-800" : "bg-white"}`}>
        <Input
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search by name or roll number"
        />
        <Select
          name="status"
          value={filters.status}
          onChange={handleChange}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          name="academicGroupId"
          value={filters.academicGroupId}
          onChange={handleChange}
        >
          <option value="all">All Academic Groups</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.className || `${group.department} - ${group.course}`}
            </option>
          ))}
        </Select>
        <Button
          type="submit"
          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
        >
          Search
        </Button>
      </form>
      {students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Register the first student to manage their academic journey."
          actionText="Create Student"
          actionLink="/admin/students/create"
        />
      ) : (
        <TableShell
          headers={["Student", "Roll Number", "Academic Group", "Status", "Actions"]}
        >
          {students.map((student) => (
            <tr key={student._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
              <td className="px-6 py-4">
                <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.rollNumber}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.academicGroupId?.className || student.academicGroupId?.department || "-"}</td>
              <td className="px-6 py-4"><StatusBadge value={student.status} /></td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" as={Link} to={`/admin/students/${student._id}`}>
                    View
                  </Button>
                  <Button variant="secondary" size="sm" as={Link} to={`/admin/students/${student._id}/edit`}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleStatusToggle(student)}>
                    {student.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(student)}>
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
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.student?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Students;
