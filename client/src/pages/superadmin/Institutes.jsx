import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const filterDefaults = {
  search: "",
  status: "all",
  instituteType: "all",
  plan: "all",
};

const StatCard = ({ label, value, detail }) => (
  <div className="rounded-[1.5rem] bg-white p-5 shadow-card">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
    <h3 className="mt-3 text-3xl font-semibold text-ink">{value}</h3>
    <p className="mt-2 text-sm text-slate-500">{detail}</p>
  </div>
);

const Institutes = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [filters, setFilters] = useState(filterDefaults);
  const [institutes, setInstitutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/institutes", { params: filters });
      setInstitutes(data.institutes);
      setStats(data.stats);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load institutes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await fetchInstitutes();
  };

  const handleStatusToggle = async (institute) => {
    try {
      const nextStatus = institute.status === "active" ? "inactive" : "active";
      await api.patch(`/institutes/${institute._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Institute marked as ${nextStatus}`);
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    }
  };

  const handleDelete = async (institute) => {
    if (!window.confirm(`Delete ${institute.name}? This will soft delete the institute.`)) {
      return;
    }

    try {
      await api.delete(`/institutes/${institute._id}`);
      setMessageTone("success");
      setMessage("Institute deleted successfully");
      await fetchInstitutes();
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete institute");
    }
  };

  const statCards = useMemo(
    () =>
      stats
        ? [
            { label: "Total Institutes", value: stats.totalInstitutes, detail: "All active records in the ERP" },
            { label: "Active Institutes", value: stats.activeInstitutes, detail: "Institutes currently enabled" },
            { label: "Schools", value: stats.schoolCount, detail: "School-type institutes" },
            { label: "Colleges", value: stats.collegeCount, detail: "College-type institutes" },
            { label: "Total Admins", value: stats.totalAdmins, detail: "Institute admin accounts" },
            { label: "Trial / Expired", value: stats.trialExpiredInstitutes, detail: "Follow-up subscription targets" },
          ]
        : [],
    [stats]
  );

  if (loading) {
    return <LoadingBlock message="Loading institute management..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Institute Management"
        description="Create, search, update and manage institutes along with quick subscription visibility."
        actions={
          <Link
            to="/super-admin/institutes/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Institute
          </Link>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, code, email..."
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          name="instituteType"
          value={filters.instituteType}
          onChange={handleFilterChange}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        >
          <option value="all">All Types</option>
          <option value="school">School</option>
          <option value="college">College</option>
        </select>
        <div className="flex gap-3">
          <select name="plan" value={filters.plan} onChange={handleFilterChange} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          <button
            type="submit"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>
      </form>

      {institutes.length === 0 ? (
        <EmptyState title="No institutes found" description="Create your first institute or adjust the filters." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Institute</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutes.map((institute) => (
                  <tr key={institute._id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-ink">{institute.name}</p>
                        <p className="text-xs text-slate-500">{institute.instituteCode} • {institute.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge value={institute.instituteType} /></td>
                    <td className="px-6 py-4"><StatusBadge value={institute.status} /></td>
                    <td className="px-6 py-4"><StatusBadge value={institute.plan} /></td>
                    <td className="px-6 py-4"><StatusBadge value={institute.paymentStatus} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/super-admin/institutes/${institute._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          View
                        </Link>
                        <Link to={`/super-admin/institutes/${institute._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(institute)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          {institute.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(institute)}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                        >
                          Delete
                        </button>
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

export default Institutes;
