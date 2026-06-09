import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { feeStatusOptions, feeTypeOptions } from "../../utils/feeOptions";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const Fees = () => {
  const { settings, getButtonRadius } = useUISettings();
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

  const handleDelete = async (feeId) => {
    if (!window.confirm("Delete this fee?")) return;

    try {
      await api.delete(`/fees/${feeId}`);
      setFees((current) => current.filter((fee) => fee._id !== feeId));
      window.alert("Fee deleted successfully");
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete fee");
    }
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

      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-5">
        <input
          placeholder="Search fee or student"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className={filterClass}
        />
        <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className={filterClass}>
          <option value="all">All Students</option>
          {students.map((student) => <option key={student._id} value={student._id}>{student.user?.name}</option>)}
        </select>
        <select value={filters.academicGroupId} onChange={(event) => setFilters((current) => ({ ...current, academicGroupId: event.target.value }))} className={filterClass}>
          <option value="all">All Groups</option>
          {academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          {feeStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.feeType} onChange={(event) => setFilters((current) => ({ ...current, feeType: event.target.value }))} className={filterClass}>
          <option value="all">All Types</option>
          {feeTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
      </div>

      <AlertMessage tone="error" message={errorMessage} />

      {filteredFees.length === 0 ? (
        <EmptyState title="No fees found" description="Create fees or adjust filters to view student dues." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Fee</th>
                  <th className="px-6 py-4 font-medium">Payable</th>
                  <th className="px-6 py-4 font-medium">Paid</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((fee) => (
                  <tr key={fee._id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{fee.studentId?.userId?.name || "-"}</p>
                      <p className="text-xs text-slate-500">{fee.studentId?.rollNumber || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{fee.title}</p>
                      <p className="text-xs text-slate-500">{formatLabel(fee.feeType)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(fee.payableAmount)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(fee.paidAmount)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(fee.dueDate)}</td>
                    <td className="px-6 py-4"><StatusBadge value={fee.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/fees/${fee._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link>
                        <Link to={`/admin/fees/${fee._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link>
                        <Link to={`/admin/fees/${fee._id}/payment`} className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Payment</Link>
                        <button type="button" onClick={() => handleDelete(fee._id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">Delete</button>
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

export default Fees;
