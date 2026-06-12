import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { FiMail, FiPhone, FiMoreVertical, FiEdit, FiKey, FiPower, FiTrash2, FiX, FiUsers, FiLayers, FiCheck } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import UserPasswordResetModal from "../../components/UserPasswordResetModal";
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
  const [filters, setFilters] = useState(filterDefaults);
  const [admins, setAdmins] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionDropdown, setActionDropdown] = useState(null);
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
    setActionDropdown(null);
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
    setActionDropdown(null);
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
  const dropdownButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when it opens
  useEffect(() => {
    if (actionDropdown && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = 180; // Approximate height for 4 items
      const bottomSpace = window.innerHeight - rect.bottom;

      // Calculate top position
      let top;
      if (bottomSpace < menuHeight) {
        // Position above if not enough space below
        top = rect.top - menuHeight - 6;
      } else {
        // Position below (default)
        top = rect.bottom + 6;
      }

      // Calculate left position (align right edge with button)
      let left = rect.right - menuWidth;
      
      // Clamp left to prevent going off-screen
      left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

      setDropdownPosition({ top, left });
    }
  }, [actionDropdown]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownButtonRef.current && !dropdownButtonRef.current.contains(event.target)) {
        setActionDropdown(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActionDropdown(null);
      }
    };

    const handleScroll = () => {
      setActionDropdown(null);
    };

    if (actionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [actionDropdown]);

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
            <div className={`h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center`}>
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
            <div className={`h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center`}>
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
            <div className={`h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center`}>
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
            <div className={`h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center`}>
              <FiLayers className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search/Filter Section */}
      <form onSubmit={handleSearch} className={`rounded-[1.75rem] p-6 shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <div className="grid gap-4 md:grid-cols-4">
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
          <div className="flex gap-2">
            <Button
              type="submit"
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="flex-1"
            >
              Search
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleResetFilters}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
        <div className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Showing {admins.length} admin{admins.length !== 1 ? "s" : ""}
        </div>
      </form>

      {admins.length === 0 ? (
        <EmptyState
          title="No admins found"
          description="Create your first institute admin user or adjust search filters."
          actionText="Create Admin"
          actionLink="/super-admin/admins/create"
        />
      ) : (
        <div className={`overflow-hidden rounded-[1.75rem] shadow-card ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={`${isDark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Institute</th>
                  <th className="px-6 py-4 font-medium w-[130px]">Status</th>
                  <th className="px-6 py-4 font-medium text-right w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin._id}
                    className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-3">
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
                    <td className="px-6 py-3">
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
                    <td className="px-6 py-3">
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
                    <td className="px-6 py-3 w-[130px]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${admin.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className={`font-medium ${admin.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                          {admin.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="relative px-4 py-4 align-middle text-right w-[100px]">
                      <div className="flex items-center justify-end h-full">
                        <button
                          ref={actionDropdown === admin._id ? dropdownButtonRef : null}
                          type="button"
                          onClick={() => setActionDropdown(actionDropdown === admin._id ? null : admin._id)}
                          className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition ${
                            actionDropdown === admin._id
                              ? isDark
                                ? "bg-slate-800/60 text-teal-400"
                                : "bg-slate-100 text-teal-600"
                              : isDark
                                ? "hover:bg-slate-700 text-slate-400"
                                : "hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          <FiMoreVertical className="h-5 w-5" />
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

      {/* Portal-rendered Actions Dropdown */}
      {actionDropdown && createPortal(
        <div
          className="fixed z-[9999] w-[190px] rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 ease-out"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(() => {
            const admin = admins.find((a) => a._id === actionDropdown);
            if (!admin) return null;
            return (
              <>
                <Link
                  to={`/super-admin/admins/${admin._id}/edit`}
                  className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition ${isDark ? "text-slate-100 hover:bg-slate-800" : "text-slate-800 hover:bg-slate-100"}`}
                  onClick={() => setActionDropdown(null)}
                >
                  <FiEdit className="h-4 w-4 flex-shrink-0" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAdmin(admin);
                    setActionDropdown(null);
                  }}
                  className={`flex items-center gap-3 h-10 w-full px-3 rounded-lg text-sm font-medium transition ${isDark ? "text-amber-400 hover:bg-slate-800" : "text-amber-600 hover:bg-amber-50"}`}
                >
                  <FiKey className="h-4 w-4 flex-shrink-0" />
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(admin);
                    setActionDropdown(null);
                  }}
                  className={`flex items-center gap-3 h-10 w-full px-3 rounded-lg text-sm font-medium transition ${isDark ? "text-slate-100 hover:bg-slate-800" : "text-slate-800 hover:bg-slate-100"}`}
                >
                  <FiPower className="h-4 w-4 flex-shrink-0" />
                  {admin.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <div className={`my-1 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(admin);
                    setActionDropdown(null);
                  }}
                  className={`flex items-center gap-3 h-10 w-full px-3 rounded-lg text-sm font-medium transition ${isDark ? "text-rose-400 hover:bg-slate-800" : "text-rose-600 hover:bg-rose-50"}`}
                >
                  <FiTrash2 className="h-4 w-4 flex-shrink-0" />
                  Delete
                </button>
              </>
            );
          })()}
        </div>,
        document.body
      )}
    </section>
  );
};

export default Admins;
