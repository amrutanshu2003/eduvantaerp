import { useEffect, useState } from "react";
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import { SkeletonCard, SkeletonLines, SkeletonButton } from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [tabLoading, setTabLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Profile form states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data } = await api.put("/auth/update-profile", {
        name,
        email,
        phone,
      });
      updateUser(data.user);
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      setUpdating(false);
      return;
    }

    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to change password");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setTimeout(() => setInitialLoading(false), 500);
  }, [user]);

  const handleTabChange = (tab) => {
    setTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setTabLoading(false), 300);
  };

  const buttonStyle = {
    backgroundColor: settings.primaryColor,
    borderRadius: getButtonRadius(settings.buttonStyle),
  };

  if (initialLoading) {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="Staff"
          title="My Profile"
          description="View and update your personal information and account settings."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard lines={["w-3/4", "w-1/2", "w-2/3"]} />
          <SkeletonCard lines={["w-full", "w-5/6", "w-3/4", "w-1/2"]} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="My Profile"
        description="View and update your personal information and account settings."
      />

      <AlertMessage tone="error" message={errorMessage} />
      <AlertMessage tone="success" message={successMessage} />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button
          onClick={() => handleTabChange("profile")}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "profile"
              ? "text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          style={activeTab === "profile" ? { borderColor: settings.primaryColor, color: settings.primaryColor } : {}}
        >
          Profile Details
        </button>
        <button
          onClick={() => handleTabChange("account")}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "account"
              ? "text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          style={activeTab === "account" ? { borderColor: settings.primaryColor, color: settings.primaryColor } : {}}
        >
          Account Settings
        </button>
      </div>

      {tabLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard lines={["w-3/4", "w-1/2", "w-2/3"]} />
          <SkeletonCard lines={["w-full", "w-5/6", "w-3/4", "w-1/2"]} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Details */}
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-ink mb-4">Edit Profile</h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                pattern="[0-9]{10}"
                title="Phone number must be exactly 10 digits"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              style={buttonStyle}
              className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {updating ? "Saving..." : "Save Details"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-ink mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex h-12 w-12 items-center justify-center text-slate-400">
                <FiLock className="text-base" />
              </span>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showCurrentPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex h-12 w-12 items-center justify-center text-slate-400">
                <FiLock className="text-base" />
              </span>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showNewPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex h-12 w-12 items-center justify-center text-slate-400">
                <FiLock className="text-base" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={updating}
              style={buttonStyle}
              className="w-full py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {updating ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
      )}
    </section>
  );
};

export default Profile;
