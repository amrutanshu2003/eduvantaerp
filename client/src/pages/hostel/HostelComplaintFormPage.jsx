import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { complaintPriorityOptions, complaintTypeOptions } from "../../utils/hostelWorkflowOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const HostelComplaintFormPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ complaintType: "maintenance", title: "", description: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const { data } = await api.post("/hostel-complaints", form);
      window.alert("Hostel complaint created successfully");
      navigate(`${basePath}/hostel/complaints/${data.complaint._id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create hostel complaint");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "student") return <Navigate to="/unauthorized" replace />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title="Raise Hostel Complaint" description="Report hostel-related issues and track resolution updates." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <select name="complaintType" value={form.complaintType} onChange={handleChange} className={inputClass}>{complaintTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>{complaintPriorityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Complaint Title" className={`${inputClass} md:col-span-2`} />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the issue" className={`${inputClass} min-h-32 md:col-span-2`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Create Complaint"}</button>
          <Link to={`${basePath}/hostel/complaints`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default HostelComplaintFormPage;
