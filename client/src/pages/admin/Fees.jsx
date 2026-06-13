import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";
import { feeStatusOptions, feeTypeOptions } from "../../utils/feeOptions";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";

const Fees = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    studentId: "all",
    academicGroupId: "all",
    status: "all",
    feeType: "all",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

  const loadData = async () => {
    try {
      const [{ data: feeData }, { data: studentData }, { data: groupData }] = await Promise.all([
        api.get("/fees", { params: filters }),
        api.get("/students"),
        api.get("/academic-groups"),
      ]);
      setFees(feeData.fees || []);
      setStudents(studentData.students || []);
      setAcademicGroups(groupData.academicGroups || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.studentId, filters.academicGroupId, filters.status, filters.feeType]);

  const filteredFees = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return fees;

    return fees.filter(
      (fee) =>
        fee.title?.toLowerCase().includes(search) ||
        fee.studentId?.userId?.name?.toLowerCase().includes(search)
    );
  }, [fees, filters.search]);

  const handleDelete = async (fee) => {
    setConfirmModal({
      type: "delete",
      fee,
      title: "Delete Fee?",
      message: "This action will remove the fee record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { fee } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/fees/${fee._id}`);
      setFees((current) => current.filter((f) => f._id !== fee._id));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete fee");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      studentId: "all",
      academicGroupId: "all",
      status: "all",
      feeType: "all",
    });
    loadData();
  };

  if (loading) return <LoadingBlock message="Loading fees..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Fees Management"
        description="Create student fees, track payment status, and monitor pending dues."
        actions={
          <Link
            to="/admin/fees/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Fee
          </Link>
        }
      />

      <FilterBar
        filters={filters}
        onFilterChange={(event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSearch={() => loadData()}
        onReset={handleResetFilters}
        searchPlaceholder="Search fee or student"
      >
        <input
          name="search"
          placeholder="Search fee or student"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select name="studentId" value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Students</option>
          {students.map((student) => <option key={student._id} value={student._id}>{student.name}</option>)}
        </select>
        <select name="academicGroupId" value={filters.academicGroupId} onChange={(event) => setFilters((current) => ({ ...current, academicGroupId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Groups</option>
          {academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Status</option>
          {feeStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="feeType" value={filters.feeType} onChange={(event) => setFilters((current) => ({ ...current, feeType: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Types</option>
          {feeTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </FilterBar>

      <AlertMessage tone="error" message={errorMessage} />

      {filteredFees.length === 0 ? (
        <EmptyState
          title="No fees found"
          description="Create student fee schedules or adjust filters to view student dues."
          actionText="Create Fee"
          actionLink="/admin/fees/create"
        />
      ) : (
        <TableShell
          headers={["Student", "Fee", "Payable", "Paid", "Due Date", "Status", "Actions"]}
        >
          {filteredFees.map((fee) => (
            <tr key={fee._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{fee.studentId?.userId?.name || "-"}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{fee.studentId?.rollNumber || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{fee.title}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{formatLabel(fee.feeType)}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatCurrency(fee.payableAmount)}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatCurrency(fee.paidAmount)}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{formatDate(fee.dueDate)}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={fee.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={fee}
                  isActive={fee.status === "paid"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(fee)}
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

export default Fees;
