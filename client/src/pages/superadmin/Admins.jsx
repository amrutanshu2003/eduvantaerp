import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiPhone, FiUsers, FiLayers, FiCheck, FiX } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import UserPasswordResetModal from "../../components/UserPasswordResetModal";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal, Input, Select } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";
import { useAuth } from "../../context/AuthContext";

const filterDefaults = {
  search: "",
  status: "all",
  instituteId: "all",
};

const getInitials = (name) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Admins = () => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(filterDefaults);
  const [admins, setAdmins] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    setConfirmModal({
      type: "status",
      admin,
      title: admin.status === "active" ? "Deactivate Admin?" : "Activate Admin?",
      message: admin.status === "active" 
        ? "This admin will no longer be able to login." 
        : "This admin will be able to login again.",
    });
  };

  const confirmStatusToggle = async () => {
    if (!confirmModal) return;
    const { admin } = confirmModal;
    try {
      setActionLoading(true);
      const nextStatus = admin.status === "active" ? "inactive" : "active";
      await api.patch(`/admin/admins/${admin._id}/status`, { status: nextStatus });
      setMessageTone("success");
      setMessage(`Admin ${admin.name} marked as ${nextStatus}`);
      setConfirmModal(null);
      // Refresh list
      const { data } = await api.get("/admin/admins", { params: filters });
      setAdmins(data.admins);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (admin) => {
    setConfirmModal({
      type: "delete",
      admin,
      title: "Delete Admin?",
      message: "This action will remove the admin record. This cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { admin } = confirmModal;
    try {
      setActionLoading(true);
      await api.delete(`/admin/admins/${admin._id}`);
      setMessageTone("success");
      setMessage("Admin user deleted successfully");
      setConfirmModal(null);
      // Refresh list
      const { data } = await api.get("/admin/admins", { params: filters });
      setAdmins(data.admins);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Unable to delete admin");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(filterDefaults);
    fetchAdminsAndInstitutes();
  };

  const stats = useMemo(() => {
    return {
      total: admins.length,
      active: admins.filter((a) => a.status === "active").length,
      inactive: admins.filter((a) => a.status === "inactive").length,
      institutes: new Set(admins.map((a) => a.instituteId?._id || a.institute?._id)).size,
    };
  }, [admins]);

  const isDark = resolvedTheme === "dark";

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
          <Button
            as={Link}
            to="/super-admin/admins/create"
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
          >
            Create Admin
          </Button>
        }
      />

      <AlertMessage tone={messageTone} message={message} />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Admins</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active Admins</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{stats.active}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FiCheck className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Inactive Admins</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{stats.inactive}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <FiX className="h-6 w-6 text-rose-500" />
            </div>
          </div>
        </div>
        <div className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Institutes Covered</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{stats.institutes}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FiLayers className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        searchPlaceholder="Search by name, email, phone..."
      >
        <Input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, email, phone..."
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
          name="instituteId"
          value={filters.instituteId}
          onChange={handleFilterChange}
        >
          <option value="all">All Institutes</option>
          {institutes.map((inst) => (
            <option key={inst._id} value={inst._id}>
              {inst.name} ({inst.instituteCode})
            </option>
          ))}
        </Select>
      </FilterBar>

      {admins.length === 0 ? (
        <EmptyState
          title="No admins found"
          description="Create your first institute admin user or adjust search filters."
          actionText="Create Admin"
          actionLink="/super-admin/admins/create"
        />
      ) : (
        <TableShell
          headers={["Name", "Contact", "Institute", "Status", "Actions"]}
        >
          {admins.map((admin) => (
            <tr
              key={admin._id}
              className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(admin.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{admin.name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"}`}>
                      Institute Admin
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FiMail className={`h-4 w-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <p className={isDark ? "text-slate-300" : "text-slate-700"}>{admin.email}</p>
                  </div>
                  {admin.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className={`h-4 w-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{admin.phone}</p>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className={`inline-flex flex-col px-3 py-2 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}>
                  <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                    {admin.instituteId?.name || (admin.institute ? admin.institute.name : "-")}
                  </p>
                  {admin.instituteId?.instituteCode && (
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {admin.instituteId.instituteCode}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={admin.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={admin}
                  isActive={admin.status === "active"}
                  onEdit={() => navigate(`/super-admin/admins/${admin._id}/edit`)}
                  onResetPassword={() => setSelectedAdmin(admin)}
                  onDeactivate={admin.status === "active" ? () => handleStatusToggle(admin) : undefined}
                  onActivate={admin.status === "inactive" ? () => handleStatusToggle(admin) : undefined}
                  onDelete={() => handleDelete(admin)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
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

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "delete" ? confirmDelete : confirmStatusToggle}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.type === "delete" ? "Delete" : confirmModal?.admin?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirmModal?.type === "delete" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </section>
  );
};

export default Admins;
