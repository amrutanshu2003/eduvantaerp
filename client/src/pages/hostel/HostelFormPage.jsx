import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageHostel } from "../../utils/hostelAccess";
import { hostelStatusOptions, hostelTypeOptions } from "../../utils/hostelOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const emptyForm = {
  hostelName: "",
  hostelCode: "",
  hostelType: "boys",
  totalFloors: "",
  address: "",
  wardenId: "",
  contactNumber: "",
  status: "active",
};

const HostelFormPage = ({ basePath, eyebrow, mode = "create" }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supportResponse, hostelResponse] = await Promise.all([
          api.get("/hostels/support-data"),
          mode === "edit" ? api.get(`/hostels/${id}`) : Promise.resolve(null),
        ]);
        setStaff((supportResponse.data.staff || []).filter((member) => member.designation === "hostel_warden"));

        if (hostelResponse?.data?.hostel) {
          const hostel = hostelResponse.data.hostel;
          setForm({
            hostelName: hostel.hostelName || "",
            hostelCode: hostel.hostelCode || "",
            hostelType: hostel.hostelType || "boys",
            totalFloors: hostel.totalFloors || "",
            address: hostel.address || "",
            wardenId: hostel.warden?._id || "",
            contactNumber: hostel.contactNumber || "",
            status: hostel.status || "active",
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load hostel form");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.hostelName.trim() || !form.hostelCode.trim() || !form.hostelType || !form.totalFloors) {
      setErrorMessage("Hostel name, hostel code, hostel type, and total floors are required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        ...form,
        totalFloors: Number(form.totalFloors),
        wardenId: form.wardenId || null,
      };
      const response = mode === "edit" ? await api.put(`/hostels/${id}`, payload) : await api.post("/hostels", payload);
      const nextId = response.data.hostel?._id || id;
      window.alert(`Hostel ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/hostels/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save hostel");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Hostel" : "Create Hostel"} description="Set up hostel master details, type, floors, and warden mapping." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="hostelName" value={form.hostelName} onChange={handleChange} placeholder="Hostel Name" className={inputClass} />
          <input name="hostelCode" value={form.hostelCode} onChange={handleChange} placeholder="Hostel Code" className={inputClass} />
          <select name="hostelType" value={form.hostelType} onChange={handleChange} className={inputClass}>
            {hostelTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input name="totalFloors" type="number" min="1" value={form.totalFloors} onChange={handleChange} placeholder="Total Floors" className={inputClass} />
          <select name="wardenId" value={form.wardenId} onChange={handleChange} className={inputClass}>
            <option value="">Select Warden</option>
            {staff.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
          </select>
          <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" className={inputClass} />
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {hostelStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className={inputClass} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : mode === "edit" ? "Update Hostel" : "Create Hostel"}
          </button>
          <Link to={`${basePath}/hostels`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default HostelFormPage;
