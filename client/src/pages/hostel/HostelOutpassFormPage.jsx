import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const HostelOutpassFormPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ reason: "", destination: "", fromDate: "", toDate: "", parentApprovalRequired: true, remarks: "" });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/hostel-outpasses", form);
      window.alert("Hostel outpass request created successfully");
      navigate(`${basePath}/hostel/outpasses/${data.outpass._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create hostel outpass");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "student") return <Navigate to="/unauthorized" replace />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title="Create Hostel Outpass" description="Submit an outpass request for temporary exit from hostel." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="reason" value={form.reason} onChange={handleChange} placeholder="Reason" className={inputClass} />
          <input name="destination" value={form.destination} onChange={handleChange} placeholder="Destination" className={inputClass} />
          <label className="space-y-2 text-sm text-slate-600"><span>From Date</span><input name="fromDate" type="date" value={form.fromDate} onChange={handleChange} className={`${inputClass} w-full`} /></label>
          <label className="space-y-2 text-sm text-slate-600"><span>To Date</span><input name="toDate" type="date" value={form.toDate} onChange={handleChange} className={`${inputClass} w-full`} /></label>
          <label className="flex items-center gap-3 text-sm text-slate-700 md:col-span-2"><input name="parentApprovalRequired" type="checkbox" checked={form.parentApprovalRequired} onChange={handleChange} /> Parent approval required</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} placeholder="Remarks" className={`${inputClass} min-h-28 md:col-span-2`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Create Outpass"}</button>
          <Link to={`${basePath}/hostel/outpasses`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default HostelOutpassFormPage;
