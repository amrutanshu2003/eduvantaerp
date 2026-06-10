import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

const EditAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    instituteId: "",
    status: "active",
    permissions: "",
  });
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAdminAndInstitutes = async () => {
      try {
        const [adminRes, instsRes] = await Promise.all([
          api.get(`/admin/admins/${id}`),
          api.get("/institutes"),
        ]);
        const admin = adminRes.data.admin;
        setFormData({
          name: admin.name || "",
          email: admin.email || "",
          phone: admin.phone || "",
          password: "",
          instituteId: admin.instituteId?._id || admin.instituteId || "",
          status: admin.status || "active",
          permissions: (admin.permissions || []).join(", "),
        });
        setInstitutes(instsRes.data.institutes);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminAndInstitutes();
  }, [id]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        permissions: formData.permissions
          .split(",")
          .map((permission) => permission.trim())
          .filter(Boolean),
      };
      if (!payload.password.trim()) {
        delete payload.password;
      }
      await api.put(`/admin/admins/${id}`, payload);
      window.alert("Admin user updated successfully");
      navigate("/super-admin/admins");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update admin user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading admin details..." />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">Edit Admin User</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Modify the details, permissions, or institute linkage for this admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className={inputClassName} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClassName} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" maxLength={10} pattern="[0-9]{10}" title="Phone number must be exactly 10 digits" value={formData.phone} onChange={handleChange} className={inputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password (Leave blank to keep current)</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className={inputClassName} minLength="8" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Institute Connection</label>
            <select name="instituteId" value={formData.instituteId} onChange={handleChange} className={inputClassName} required>
              <option value="">Select Institute</option>
              {institutes.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name} ({inst.instituteCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputClassName}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Permissions</label>
            <textarea
              name="permissions"
              rows="4"
              value={formData.permissions}
              onChange={handleChange}
              className={`${inputClassName} resize-none`}
            />
            <p className="mt-2 text-xs text-slate-500">Comma-separated values like `students.view, ui.customize`</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Admin User"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EditAdmin;
