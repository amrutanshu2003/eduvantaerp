import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import UserPasswordResetModal from "../../components/UserPasswordResetModal";
import { useUISettings } from "../../context/UISettingsContext";

const filterDefaults = {
  search: "",
  status: "all",
  instituteId: "all",
};

const Admins = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [filters, setFilters] = useState(filterDefaults);
  const [admins, setAdmins] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const fetchAdminsAndInstitutes = async () => {
    try {
      setLoading(true);
      const [adminsRes, institutesRes] = await Promise.all([
        api.get("/admin/admins", { params: filters }),
        api.get("/institutes"),
      ]);
      setAdmins(adminsRes.data.admins);
      setInstitutes(institutesRes.data.institutes);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to load admins data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminsAndInstitutes();
  }, []);

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const { data } = await api.get("/admin/admins", { params: filters });
      setAdmins(data.admins);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (admin) => {
    try {
      const nextStatus = admin.status === "active" ? "inactive" : "active";
      await api.patch(`/admin/admins/${admin._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Admin ${admin.name} marked as ${nextStatus}`);
      // Refresh list
      const { data } = await api.get("/admin/admins", { params: filters });
      setAdmins(data.admins);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    }
  };

  const handleDelete = async (admin) => {
    if (!(await window.confirm(`Delete admin user ${admin.name}?`))) {
      return;
    }

    try {
      await api.delete(`/admin/admins/${admin._id}`);
      setMessageTone("success");
      setMessage("Admin user deleted successfully");
      // Refresh list
      const { data } = await api.get("/admin/admins", { params: filters });
      setAdmins(data.admins);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete admin");
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading admin users management..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Admin User Management"
        description="View and manage institute admin accounts across all registered institutes."
        actions={
          <Link
            to="/super-admin/admins/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Create Admin
          </Link>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      <form onSubmit={handleSearch} className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-4">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, email, phone..."
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          name="instituteId"
          value={filters.instituteId}
          onChange={handleFilterChange}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
        >
          <option value="all">All Institutes</option>
          {institutes.map((inst) => (
            <option key={inst._id} value={inst._id}>
              {inst.name} ({inst.instituteCode})
            </option>
          ))}
        </select>
        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Search & Filter
          </button>
        </div>
      </form>

      {admins.length === 0 ? (
        <EmptyState title="No admins found" description="Create your first institute admin user or adjust search filters." />
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Institute</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-ink">{admin.name}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-700">{admin.email}</p>
                        <p className="text-xs text-slate-400">{admin.phone || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {admin.instituteId?.name || (admin.institute ? admin.institute.name : "-")}
                    </td>
                    <td className="px-6 py-4"><StatusBadge value={admin.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/super-admin/admins/${admin._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedAdmin(admin)}
                          className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(admin)}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          {admin.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(admin)}
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
      <UserPasswordResetModal
        open={Boolean(selectedAdmin)}
        onClose={() => setSelectedAdmin(null)}
        targetId={selectedAdmin?._id}
        targetRole="admin"
        targetLabel={selectedAdmin?.name || "Admin"}
        onSuccess={(nextMessage) => {
          setMessageTone("success");
          setMessage(nextMessage);
        }}
      />
    </section>
  );
};

export default Admins;
