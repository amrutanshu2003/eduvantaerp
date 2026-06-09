import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import { useUISettings } from "../../context/UISettingsContext";

const StaffPermissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [staff, setStaff] = useState(null);
  const [permissions, setPermissions] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await api.get(`/staff/${id}`);
        setStaff(data.staff);
        setPermissions((data.staff.permissions || []).join(", "));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load staff permissions");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/staff/${id}/permissions`, {
        permissions: permissions.split(",").map((value) => value.trim()).filter(Boolean),
      });
      window.alert("Permissions updated successfully");
      navigate(`/admin/staff/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update permissions");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading permissions..." />;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">Update Staff Permissions</h1>
        <p className="mt-3 text-sm text-slate-600">Manage permission codes for {staff?.name}.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <label className="mb-2 block text-sm font-medium text-slate-700">Permissions</label>
        <textarea value={permissions} onChange={(event) => setPermissions(event.target.value)} rows="6" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <p className="mt-2 text-xs text-slate-500">Comma-separated permissions like `fees.manage, library.manage, ui.customize`</p>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Saving..." : "Save Permissions"}</button>
        </div>
      </form>
    </section>
  );
};

export default StaffPermissions;
