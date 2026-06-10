import { useEffect, useState } from "react";
import {
  FiUser,
  FiBookOpen,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiActivity,
  FiHash,
  FiBriefcase,
  FiAward,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const Profile = () => {
  const { settings } = useUISettings();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Tab and password change states
  const [activeTab, setActiveTab] = useState("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match");
      setUpdating(false);
      return;
    }

    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccessMessage(data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to update password. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get("/students/profile");
        setStudent(data.student);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Unable to load student profile"
        );
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) return <LoadingBlock message="Loading your profile..." />;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Profile"
        description="View your personal, academic, and parent details registered with the institute."
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button
          onClick={() => {
            setActiveTab("profile");
            setSuccessMessage("");
            setErrorMessage("");
          }}
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
          onClick={() => {
            setActiveTab("account");
            setSuccessMessage("");
            setErrorMessage("");
          }}
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

      <AlertMessage tone="error" message={errorMessage} />

      {activeTab === "profile" && student && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          
          {/* Left Column: Avatar & Summary Card */}
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card flex flex-col items-center text-center space-y-6">
            <div className="relative">
              {/* Avatar placeholder with modern gradient */}
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <FiUser className="text-5xl" />
              </div>
              <span className={`absolute bottom-1.5 right-1.5 flex h-4 w-4 rounded-full border-2 border-white ${
                student.status === "active" ? "bg-emerald-500" : "bg-slate-400"
              }`} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-ink">{student.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{student.email}</p>
              <span className="inline-block rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 mt-3 border border-indigo-100">
                Roll No: {student.rollNumber}
              </span>
            </div>

            <div className="w-full border-t border-slate-100 pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Status</span>
                <span className={`font-semibold capitalize ${
                  student.status === "active" ? "text-emerald-600" : "text-slate-500"
                }`}>
                  {student.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Admission No</span>
                <span className="font-semibold text-ink">{student.admissionNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Reg No</span>
                <span className="font-semibold text-ink">{student.registrationNumber || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Grouped Details Panels */}
          <div className="space-y-6">
            
            {/* Panel 1: Academic Details */}
            <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FiBookOpen className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-ink">Academic Information</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Class/Academic Group</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.className || "Not Assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Section</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.section || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Department</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.department || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course / Program</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.course || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Semester / Year</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.semester
                      ? `Semester ${student.academicGroup.semester}`
                      : student.academicGroup?.year
                      ? `Year ${student.academicGroup.year}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Batch</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {student.academicGroup?.batch || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admission Date</p>
                  <p className="mt-1 font-semibold text-ink text-base">
                    {formatDate(student.admissionDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel 2: Personal Details */}
            <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <FiUser className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-ink">Personal Information</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <FiCalendar className="text-slate-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date of Birth</p>
                    <p className="mt-1 font-semibold text-ink">{formatDate(student.dob)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiAward className="text-slate-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gender</p>
                    <p className="mt-1 font-semibold text-ink capitalize">{student.gender || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiActivity className="text-slate-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Blood Group</p>
                    <p className="mt-1 font-semibold text-ink uppercase">{student.bloodGroup || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiPhone className="text-slate-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</p>
                    <p className="mt-1 font-semibold text-ink">{student.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <FiMapPin className="text-slate-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Permanent Address</p>
                    <p className="mt-1 font-semibold text-ink leading-relaxed">{student.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Parent / Guardian Information */}
            <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FiShield className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-ink">Parent / Guardian Details</h3>
              </div>

              {(!student.parents || student.parents.length === 0) ? (
                <p className="text-sm text-slate-500 italic">No parent profiles linked to your account.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {student.parents.map((parent, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 p-4 space-y-3 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">{parent.name}</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 capitalize">
                          {parent.relation || "Parent"}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        {parent.phone && <p className="flex items-center gap-1.5"><FiPhone /> {parent.phone}</p>}
                        {parent.email && <p className="flex items-center gap-1.5"><FiMail /> {parent.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 4: Institute Details */}
            {student.institute && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FiBriefcase className="text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-ink">Institute Information</h3>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Institute</p>
                    <p className="mt-1 font-semibold text-ink">{student.institute.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institute Code</p>
                    <p className="mt-1 font-semibold text-ink uppercase">{student.institute.instituteCode}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {activeTab === "account" && (
        <div className="mx-auto max-w-xl rounded-[1.75rem] bg-white p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}>
              <FiLock className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-ink">Change Password</h3>
          </div>

          {successMessage && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex h-12 w-12 items-center justify-center text-slate-400">
                <FiLock className="text-base" />
              </span>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm leading-6 outline-none transition focus:border-brand-600"
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
                placeholder="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm leading-6 outline-none transition focus:border-brand-600"
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
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-12 pr-12 text-sm leading-6 outline-none transition focus:border-brand-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showConfirmNewPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={updating}
              style={{ backgroundColor: settings.primaryColor }}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {updating ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};

export default Profile;
