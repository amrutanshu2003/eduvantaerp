import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { settings, getButtonRadius } = useUISettings();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");

  // Password Reset States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Super Admins Team States
  const [team, setTeam] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Super Admin Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Alert States
  const [alertText, setAlertText] = useState("");
  const [alertTone, setAlertTone] = useState("success");

  const triggerAlert = (text, tone = "success") => {
    setAlertText(text);
    setAlertTone(tone);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Profile Save Handler
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/update-profile", {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
      });
      updateUser(data.user);
      triggerAlert("Profile updated successfully!");
    } catch (err) {
      triggerAlert(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  // Password Update Handler
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerAlert("New password and confirm password do not match", "error");
      return;
    }
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerAlert("Password updated successfully!");
    } catch (err) {
      triggerAlert(err.response?.data?.message || "Failed to update password", "error");
    }
  };

  // Fetch Super Admins list
  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const { data } = await api.get("/admin/superadmins", {
        params: { search: searchQuery },
      });
      setTeam(data.superadmins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === "team") {
      fetchTeam();
    }
  }, [activeTab, searchQuery]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setAdminName("");
    setAdminEmail("");
    setAdminPhone("");
    setAdminPassword("");
    setEditingAdminId(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (admin) => {
    setModalMode("edit");
    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminPhone(admin.phone || "");
    setAdminPassword("");
    setEditingAdminId(admin._id);
    setShowModal(true);
  };

  // Handle Create or Edit submission
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await api.post("/admin/superadmins", {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword,
        });
        triggerAlert("New Super Admin created successfully!");
      } else {
        await api.put(`/admin/superadmins/${editingAdminId}`, {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword || undefined,
        });
        triggerAlert("Super Admin updated successfully!");
      }
      setShowModal(false);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  // Handle Super Admin Delete
  const handleAdminDelete = async (adminId, adminName) => {
    if (String(user._id) === String(adminId)) {
      triggerAlert("You cannot delete your own logged-in account.", "error");
      return;
    }

    if (!(await window.confirm(`Are you sure you want to delete ${adminName}? This will soft-delete their account.`))) {
      return;
    }

    try {
      await api.delete(`/admin/superadmins/${adminId}`);
      triggerAlert("Super Admin deleted successfully.");
      fetchTeam();
    } catch (err) {
      triggerAlert(err.response?.data?.message || "Failed to delete Super Admin", "error");
    }
  };

  const buttonStyle = {
    backgroundColor: settings.primaryColor,
    borderRadius: getButtonRadius(settings.buttonStyle),
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Settings & Profile"
        description="Manage your account preferences, reset passwords, and coordinate Super Admin credentials."
      />

      {alertText && <AlertMessage tone={alertTone} message={alertText} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 outline-none ${
            activeTab === "profile"
              ? "border-slate-900 text-ink"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 outline-none ${
            activeTab === "team"
              ? "border-slate-900 text-ink"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Super Admin Team
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Details Form */}
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card border border-slate-100">
            <h3 className="text-lg font-bold text-ink mb-4">Edit Profile</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <button
                type="submit"
                style={buttonStyle}
                className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 mt-2"
              >
                Save Details
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card border border-slate-100">
            <h3 className="text-lg font-bold text-ink mb-4">Reset Password</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <button
                type="submit"
                style={buttonStyle}
                className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 mt-2"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="space-y-4">
          {/* Search bar & Add Button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-[1.25rem] shadow-card border border-slate-100">
            <input
              type="text"
              placeholder="Search Super Admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 max-w-md"
            />
            <button
              type="button"
              onClick={openCreateModal}
              style={buttonStyle}
              className="px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 flex items-center gap-2 self-start md:self-auto"
            >
              Add Super Admin
            </button>
          </div>

          {loadingTeam ? (
            <LoadingBlock message="Loading team members..." />
          ) : team.length === 0 ? (
            <EmptyState title="No Super Admins found" description="Adjust your filters or add a new team member." />
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((admin) => (
                      <tr key={admin._id} className="border-t border-slate-100">
                        <td className="px-6 py-4 font-semibold text-ink">{admin.name}</td>
                        <td className="px-6 py-4 text-slate-600">{admin.email}</td>
                        <td className="px-6 py-4 text-slate-600">{admin.phone || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800`}>
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(admin)}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDelete(admin._id, admin.name)}
                              disabled={String(user._id) === String(admin._id)}
                              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      )}

      {/* Glassmorphic Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white/90 ring-1 ring-slate-200/80 p-6 shadow-card backdrop-blur-lg">
            <h3 className="text-xl font-bold text-ink mb-4">
              {modalMode === "create" ? "Add New Super Admin" : `Edit Super Admin: ${adminName}`}
            </h3>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Password {modalMode === "edit" && "(Leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={modalMode === "create"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={buttonStyle}
                  className="px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {modalMode === "create" ? "Create Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Settings;
