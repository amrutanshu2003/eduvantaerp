import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import { SkeletonCard } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("") || "SA";

const getPasswordStrengthHint = (password = "") => {
  if (!password) {
    return { tone: "neutral", text: "Use at least 8 characters with a mix of letters, numbers, and symbols." };
  }
  if (password.length < 8) {
    return { tone: "weak", text: "Password is too short. Minimum 8 characters required." };
  }

  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const score = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;

  if (score === 3) {
    return { tone: "strong", text: "Strong password. Good mix of letters, numbers, and symbols." };
  }
  if (score === 2) {
    return { tone: "medium", text: "Decent password. Add a symbol or number to make it stronger." };
  }
  return { tone: "weak", text: "Weak password. Add numbers and symbols for better security." };
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { settings, resolvedTheme, getButtonRadius } = useUISettings();
  const isDark = resolvedTheme === "dark";

  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [team, setTeam] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [alertText, setAlertText] = useState("");
  const [alertTone, setAlertTone] = useState("success");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const triggerAlert = (text, tone = "success") => {
    setAlertText(text);
    setAlertTone(tone);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const profileCardClass = isDark
    ? "rounded-[2rem] border border-slate-800 bg-slate-900/85 p-6 shadow-card"
    : "rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-card";

  const mutedPanelClass = isDark
    ? "rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-5"
    : "rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5";

  const buttonStyle = {
    backgroundColor: settings.primaryColor,
    borderRadius: getButtonRadius(settings.buttonStyle),
  };

  const passwordHint = useMemo(() => getPasswordStrengthHint(newPassword), [newPassword]);
  const filteredTeamCount = team.length;
  const activeTeamCount = useMemo(() => team.filter((member) => (member.status || "active") === "active").length, [team]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfilePhone(user.phone || "");
    }
    const timer = setTimeout(() => setInitialLoading(false), 350);
    return () => clearTimeout(timer);
  }, [user]);

  const fetchTeam = async (query = "") => {
    setLoadingTeam(true);
    try {
      const { data } = await api.get("/admin/superadmins", {
        params: { search: query },
      });
      setTeam(data.superadmins || []);
    } catch {
      setTeam([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchTeam("");
  }, []);

  useEffect(() => {
    if (activeTab === "team") {
      fetchTeam(searchQuery);
    }
  }, [activeTab, searchQuery]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSubmitting(true);
    try {
      const { data } = await api.put("/auth/update-profile", {
        name: profileName,
        phone: profilePhone,
      });
      updateUser(data.user);
      setProfileEmail(data.user?.email || profileEmail);
      triggerAlert("Profile updated successfully.");
    } catch (error) {
      triggerAlert(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();

    if (!currentPassword) {
      triggerAlert("Current password is required.", "error");
      return;
    }
    if (newPassword.length < 8) {
      triggerAlert("New password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerAlert("Confirm password must match the new password.", "error");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerAlert("Password updated successfully.");
    } catch (error) {
      triggerAlert(error.response?.data?.message || "Failed to update password", "error");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingAdminId(null);
    setAdminName("");
    setAdminEmail("");
    setAdminPhone("");
    setAdminPassword("");
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setModalMode("edit");
    setEditingAdminId(admin._id);
    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminPhone(admin.phone || "");
    setAdminPassword("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setAdminPassword("");
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    setModalSubmitting(true);

    try {
      if (modalMode === "create") {
        await api.post("/admin/superadmins", {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword,
        });
        triggerAlert("New Super Admin created successfully.");
      } else {
        await api.put(`/admin/superadmins/${editingAdminId}`, {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword || undefined,
        });
        triggerAlert("Super Admin updated successfully.");
      }
      closeModal();
      fetchTeam(searchQuery);
    } catch (error) {
      triggerAlert(error.response?.data?.message || "Action failed", "error");
    } finally {
      setModalSubmitting(false);
    }
  };

  const openDeleteModal = (admin) => {
    if (String(user?._id) === String(admin._id)) {
      triggerAlert("You cannot delete your own logged-in account.", "error");
      return;
    }
    setDeleteTarget(admin);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/admin/superadmins/${deleteTarget._id}`);
      triggerAlert("Super Admin deleted successfully.");
      setDeleteTarget(null);
      fetchTeam(searchQuery);
    } catch (error) {
      triggerAlert(error.response?.data?.message || "Failed to delete Super Admin", "error");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <section className="space-y-6 pb-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
          <SkeletonCard lines={["w-1/2", "w-3/4", "w-2/3"]} />
          <SkeletonCard lines={["w-full", "w-5/6", "w-3/4"]} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">
      {alertText ? <AlertMessage tone={alertTone} message={alertText} /> : null}

      <div
        className={`overflow-hidden rounded-[2rem] border px-6 py-6 sm:px-8 ${
          isDark
            ? "border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#111c34_45%,#0f172a_100%)]"
            : "border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_30%),linear-gradient(135deg,#f8fbff_0%,#f1f7ff_40%,#ffffff_100%)]"
        }`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className={`text-xs font-semibold uppercase tracking-[0.32em] ${isDark ? "text-emerald-300" : "text-teal-700"}`}>
              Super Admin
            </p>
            <h2 className={`text-3xl font-semibold sm:text-4xl ${isDark ? "text-white" : "text-ink"}`}>My Profile</h2>
            <p className={`mt-3 text-sm leading-7 sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Manage your profile, password and super admin team access.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Team Members", value: filteredTeamCount, icon: FiUsers },
              { label: "Active", value: activeTeamCount, icon: FiCheckCircle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`min-w-[132px] rounded-[1.4rem] px-4 py-4 ${
                    isDark ? "bg-white/5 ring-1 ring-white/10" : "bg-white/80 ring-1 ring-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</p>
                    <Icon className={isDark ? "text-slate-400" : "text-slate-500"} />
                  </div>
                  <p className={`mt-3 text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={profileCardClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] text-2xl font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
              }}
            >
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{user?.name || "Super Admin"}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {user?.status || "active"}
                </span>
              </div>
              <p className={`mt-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>Platform Owner</p>
              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            {[
              { label: "Phone", value: user?.phone || "Not added yet", icon: FiPhone },
              { label: "Role", value: "Super Admin", icon: FiShield },
              { label: "Team", value: `${activeTeamCount}/${filteredTeamCount} Active`, icon: FiUsers },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`${mutedPanelClass} flex items-center gap-3`}>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-700"}`}>
                    <Icon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className={`mt-1 truncate text-sm font-medium ${isDark ? "text-slate-100" : "text-ink"}`}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={profileCardClass}>
        <div className={`inline-flex w-full flex-wrap gap-2 rounded-[1.5rem] p-2 sm:w-auto sm:gap-0 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
          {[
            { id: "profile", label: "My Profile", icon: FiUser },
            { id: "team", label: "Super Admin Team", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={active ? buttonStyle : undefined}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  active ? "text-white shadow-sm" : isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "profile" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={profileCardClass}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
                <FiEdit3 />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-ink"}`}>Personal Details</h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Update the identity information tied to your account.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Name</label>
                <input type="text" required value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClassName} />
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email Address</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiMail />
                  </span>
                  <input type="email" readOnly value={profileEmail} className={`${inputClassName} cursor-not-allowed pl-12 opacity-80`} />
                </div>
                <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email address cannot be changed.</p>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Phone Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiPhone />
                  </span>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    className={`${inputClassName} pl-12`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                style={buttonStyle}
                className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {profileSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className={profileCardClass}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
                <FiLock />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-ink"}`}>Account Security</h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Refresh your password regularly to keep the control center secure.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
              {[
                {
                  label: "Current Password",
                  value: currentPassword,
                  setter: setCurrentPassword,
                  visible: showCurrentPassword,
                  toggle: () => setShowCurrentPassword((current) => !current),
                },
                {
                  label: "New Password",
                  value: newPassword,
                  setter: setNewPassword,
                  visible: showNewPassword,
                  toggle: () => setShowNewPassword((current) => !current),
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  setter: setConfirmPassword,
                  visible: showConfirmPassword,
                  toggle: () => setShowConfirmPassword((current) => !current),
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{field.label}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                      <FiLock />
                    </span>
                    <input
                      type={field.visible ? "text" : "password"}
                      required={field.label !== "Confirm New Password" || Boolean(newPassword)}
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      className={`${inputClassName} pl-12 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={field.toggle}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-800 dark:hover:text-white"
                    >
                      {field.visible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              ))}

              <div className={`rounded-2xl border px-4 py-3 text-xs ${isDark ? "border-slate-700 bg-slate-950/70 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                <p className="font-semibold uppercase tracking-[0.18em] text-slate-400">Password Strength</p>
                <p className="mt-2 leading-6">{passwordHint.text}</p>
              </div>

              <div className={`rounded-2xl border px-4 py-3 text-xs ${isDark ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  <p>Current password is required, new password must be at least 8 characters, and confirm password must exactly match.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSubmitting}
                style={buttonStyle}
                className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {passwordSubmitting ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className={profileCardClass}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={mutedPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Team Members</p>
                  <p className={`mt-2 text-3xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{filteredTeamCount}</p>
                </div>
                <div className={mutedPanelClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Active Count</p>
                  <p className={`mt-2 text-3xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>{activeTeamCount}</p>
                </div>
              </div>
            </div>

            <div className={profileCardClass}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="relative max-w-xl">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Super Admins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClassName} pl-12`}
                  />
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  style={buttonStyle}
                  className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                >
                  <FiPlus />
                  <span>Add Super Admin</span>
                </button>
              </div>
            </div>
          </div>

          {loadingTeam ? (
            <LoadingBlock message="Loading super admin team..." />
          ) : team.length === 0 ? (
            <EmptyState title="No Super Admins found" description="Adjust your search or create a new account from here." />
          ) : (
            <div className={profileCardClass}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-ink"}`}>Super Admin Team</h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage privileged accounts without exposing passwords or leaving your profile workspace.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {filteredTeamCount} records
                </span>
              </div>

              <div className="grid gap-4 md:hidden">
                {team.map((admin) => (
                  <div
                    key={admin._id}
                    className={`rounded-[1.5rem] border p-4 ${isDark ? "border-slate-800 bg-slate-950/65" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
                        }}
                      >
                        {getInitials(admin.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`truncate font-semibold ${isDark ? "text-white" : "text-ink"}`}>{admin.name}</p>
                            <p className={`mt-1 truncate text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{admin.email}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                            {admin.status || "Active"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className={`rounded-2xl px-3 py-3 ${isDark ? "bg-slate-900" : "bg-white"}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Phone</p>
                            <p className={`mt-1 text-sm font-medium ${isDark ? "text-slate-200" : "text-ink"}`}>{admin.phone || "-"}</p>
                          </div>
                          <div className={`rounded-2xl px-3 py-3 ${isDark ? "bg-slate-900" : "bg-white"}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Role</p>
                            <p className={`mt-1 text-sm font-medium ${isDark ? "text-slate-200" : "text-ink"}`}>Super Admin</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(admin)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                              isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <FiEdit3 size={14} />
                            <span>Edit Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(admin)}
                            disabled={String(user?._id) === String(admin._id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              isDark ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-rose-200 text-rose-600 hover:bg-rose-50"
                            }`}
                          >
                            <FiTrash2 size={14} />
                            <span>Delete Admin</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className={isDark ? "text-slate-400" : "text-slate-500"}>
                    <tr className={isDark ? "border-b border-slate-800" : "border-b border-slate-200"}>
                      <th className="px-4 py-4 font-medium">Name</th>
                      <th className="px-4 py-4 font-medium">Email</th>
                      <th className="px-4 py-4 font-medium">Phone</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((admin) => (
                      <tr key={admin._id} className={isDark ? "border-b border-slate-800/80 last:border-b-0" : "border-b border-slate-100 last:border-b-0"}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                              style={{
                                background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
                              }}
                            >
                              {getInitials(admin.name)}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? "text-white" : "text-ink"}`}>{admin.name}</p>
                              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Super Admin</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{admin.email}</td>
                        <td className={`px-4 py-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{admin.phone || "-"}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                            {admin.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(admin)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                                isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <FiEdit3 size={13} />
                              <span>Edit Admin</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(admin)}
                              disabled={String(user?._id) === String(admin._id)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                isDark ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-rose-200 text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              <FiTrash2 size={13} />
                              <span>Delete Admin</span>
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

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-[2rem] p-6 shadow-card ${isDark ? "border border-slate-800 bg-slate-900" : "border border-slate-200 bg-white"}`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
                  {modalMode === "create" ? <FiPlus /> : <FiEdit3 />}
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>
                    {modalMode === "create" ? "Add New Super Admin" : "Edit Super Admin"}
                  </h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {modalMode === "create" ? "Create a new privileged account." : "Update name, email, phone, or password."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className={`rounded-full p-2 transition ${isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Name</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiUser />
                  </span>
                  <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className={`${inputClassName} pl-12`} />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiMail />
                  </span>
                  <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={`${inputClassName} pl-12`} />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Phone</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiPhone />
                  </span>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    className={`${inputClassName} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Password {modalMode === "edit" ? "(leave blank to keep current)" : ""}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    required={modalMode === "create"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className={`${inputClassName} pl-12`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                    isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={buttonStyle}
                  className="rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {modalSubmitting ? "Saving..." : modalMode === "create" ? "Create Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-[2rem] p-6 shadow-card ${isDark ? "border border-slate-800 bg-slate-900" : "border border-slate-200 bg-white"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600"}`}>
                <FiTrash2 />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-ink"}`}>Delete Super Admin?</h3>
                <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  You are about to remove <span className="font-semibold">{deleteTarget.name}</span>. This will soft-delete the account and can affect team access.
                </p>
              </div>
            </div>

            <div className={`mt-5 rounded-2xl border px-4 py-3 text-xs ${isDark ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              Passwords are never displayed here. Only account metadata is shown before deletion.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  isDark ? "bg-rose-500 hover:bg-rose-400" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {deleteSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Settings;
