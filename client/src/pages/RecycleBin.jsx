import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import EmptyState from "../components/EmptyState";
import LoadingBlock from "../components/LoadingBlock";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useUISettings } from "../context/UISettingsContext";

const filterOptionsByRole = {
  admin: [
    { value: "all", label: "All Roles" },
    { value: "teacher", label: "Teachers" },
    { value: "student", label: "Students" },
    { value: "parent", label: "Parents" },
    { value: "staff", label: "Staff" },
  ],
  superadmin: [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admins" },
    { value: "teacher", label: "Teachers" },
    { value: "student", label: "Students" },
    { value: "parent", label: "Parents" },
    { value: "staff", label: "Staff" },
  ],
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatRoleLabel = (role) => {
  const labels = {
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
    staff: "Staff",
  };

  return labels[role] || role;
};

const RecycleBin = () => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [filters, setFilters] = useState({ role: "all", search: "" });
  const [items, setItems] = useState([]);
  const [retentionDays, setRetentionDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const filterOptions = useMemo(
    () => filterOptionsByRole[user?.role] || filterOptionsByRole.admin,
    [user?.role]
  );

  const fetchRecycleBin = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/recycle-bin", { params: nextFilters });
      setItems(data.items || []);
      setRetentionDays(data.retentionDays || 7);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load recycle bin items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await fetchRecycleBin(filters);
  };

  const handleRestore = async (item) => {
    setSubmittingId(`${item.entityType}-${item.id}`);
    try {
      const { data } = await api.patch(`/admin/recycle-bin/${item.entityType}/${item.id}/restore`);
      setMessageTone("success");
      setMessage(data.message || "Item restored successfully");
      await fetchRecycleBin(filters);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to restore recycle bin item");
    } finally {
      setSubmittingId("");
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm(`Permanently delete ${item.name}? This cannot be undone.`)) {
      return;
    }

    setSubmittingId(`${item.entityType}-${item.id}`);
    try {
      const { data } = await api.delete(`/admin/recycle-bin/${item.entityType}/${item.id}/permanent`);
      setMessageTone("success");
      setMessage(data.message || "Item permanently deleted");
      await fetchRecycleBin(filters);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to permanently delete recycle bin item");
    } finally {
      setSubmittingId("");
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading recycle bin..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={user?.role === "superadmin" ? "Super Admin" : "Admin"}
        title="Recycle Bin"
        description={`Deleted user records stay here for ${retentionDays} days before permanent database removal.`}
      />

      <AlertMessage tone={messageTone} message={message} />

      <form onSubmit={handleFilterSubmit} className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-[0.8fr_1.2fr_auto]">
        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, email, phone, roll number, employee ID..."
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Recycle bin is empty"
          description="Deleted teacher, student, parent, staff, and admin records will appear here before permanent cleanup."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Deleted On</th>
                  <th className="px-6 py-4 font-medium">Auto Delete</th>
                  {user?.role === "superadmin" ? <th className="px-6 py-4 font-medium">Institute</th> : null}
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isSubmitting = submittingId === `${item.entityType}-${item.id}`;
                  return (
                    <tr key={`${item.entityType}-${item.id}`} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-ink">{item.name}</p>
                          <p className="text-slate-600">{item.email || "-"}</p>
                          <p className="text-xs text-slate-400">
                            {item.role === "student"
                              ? `${item.meta.rollNumber || "-"} • ${item.meta.admissionNumber || "-"}`
                              : item.meta.employeeId || item.meta.staffId || item.phone || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatRoleLabel(item.role)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateTime(item.deletedAt)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-700">{formatDateTime(item.recycleBinExpiresAt)}</p>
                          <p className="text-xs text-slate-400">{item.daysRemaining} day(s) left</p>
                        </div>
                      </td>
                      {user?.role === "superadmin" ? (
                        <td className="px-6 py-4 text-slate-600">
                          {item.institute?.name || "-"}
                          {item.institute?.instituteCode ? (
                            <p className="text-xs text-slate-400">{item.institute.instituteCode}</p>
                          ) : null}
                        </td>
                      ) : null}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isSubmitting}
                            className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            disabled={isSubmitting}
                            className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecycleBin;
