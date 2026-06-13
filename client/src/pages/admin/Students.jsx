import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal, Input, Select } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Students = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "all", academicGroupId: "all" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

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

  const handleFilterChange = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSearch = (event) => {
    event.preventDefault();
    fetchData();
  };
  const handleResetFilters = () => {
    setFilters({ search: "", status: "all", academicGroupId: "all" });
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
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        searchPlaceholder="Search by name or roll number"
      >
        <Input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name or roll number"
        />
        <Select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          name="academicGroupId"
          value={filters.academicGroupId}
          onChange={handleFilterChange}
        >
          <option value="all">All Academic Groups</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.className || `${group.department} - ${group.course}`}
            </option>
          ))}
        </Select>
      </FilterBar>
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
            <tr key={student._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{student.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{student.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{student.rollNumber}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{student.academicGroupId?.className || student.academicGroupId?.department || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={student.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={student}
                  isActive={student.status === "active"}
                  onView={(item) => navigate(`/admin/students/${item._id}`)}
                  onEdit={(item) => navigate(`/admin/students/${item._id}/edit`)}
                  onDeactivate={student.status === "active" ? () => handleStatusToggle(student) : undefined}
                  onActivate={student.status === "inactive" ? () => handleStatusToggle(student) : undefined}
                  onDelete={() => handleDelete(student)}
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
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.student?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Students;
