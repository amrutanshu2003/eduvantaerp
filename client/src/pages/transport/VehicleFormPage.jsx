import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageTransport } from "../../utils/transportAccess";
import { vehicleStatusOptions, vehicleTypeOptions } from "../../utils/transportOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const emptyForm = {
  vehicleNumber: "",
  vehicleType: "bus",
  capacity: "",
  driverId: "",
  helperId: "",
  insuranceExpiry: "",
  pollutionExpiry: "",
  fitnessExpiry: "",
  status: "active",
};

const VehicleFormPage = ({ basePath, eyebrow, mode = "create" }) => {
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
        const [supportResponse, vehicleResponse] = await Promise.all([
          api.get("/transport/support-data"),
          mode === "edit" ? api.get(`/transport/vehicles/${id}`) : Promise.resolve(null),
        ]);
        setStaff(supportResponse.data.staff || []);

        if (vehicleResponse?.data?.vehicle) {
          const vehicle = vehicleResponse.data.vehicle;
          setForm({
            vehicleNumber: vehicle.vehicleNumber || "",
            vehicleType: vehicle.vehicleType || "bus",
            capacity: vehicle.capacity || "",
            driverId: vehicle.driver?._id || "",
            helperId: vehicle.helper?._id || "",
            insuranceExpiry: vehicle.insuranceExpiry ? String(vehicle.insuranceExpiry).slice(0, 10) : "",
            pollutionExpiry: vehicle.pollutionExpiry ? String(vehicle.pollutionExpiry).slice(0, 10) : "",
            fitnessExpiry: vehicle.fitnessExpiry ? String(vehicle.fitnessExpiry).slice(0, 10) : "",
            status: vehicle.status || "active",
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load vehicle form");
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

    if (!form.vehicleNumber.trim() || !form.capacity) {
      setErrorMessage("Vehicle number and capacity are required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        ...form,
        driverId: form.driverId || null,
        helperId: form.helperId || null,
        capacity: Number(form.capacity),
        insuranceExpiry: form.insuranceExpiry || null,
        pollutionExpiry: form.pollutionExpiry || null,
        fitnessExpiry: form.fitnessExpiry || null,
      };
      const response = mode === "edit" ? await api.put(`/transport/vehicles/${id}`, payload) : await api.post("/transport/vehicles", payload);
      const nextId = response.data.vehicle?._id || id;
      window.alert(`Vehicle ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/vehicles/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading vehicle form..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={mode === "edit" ? "Edit Vehicle" : "Create Vehicle"}
        description="Capture vehicle, driver, helper, and compliance details for institute transport."
      />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="Vehicle Number" className={inputClass} />
          <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} placeholder="Capacity" className={inputClass} />
          <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className={inputClass}>
            {vehicleTypeOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {vehicleStatusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select name="driverId" value={form.driverId} onChange={handleChange} className={inputClass}>
            <option value="">Select Driver</option>
            {staff.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name} ({member.designation})
              </option>
            ))}
          </select>
          <select name="helperId" value={form.helperId} onChange={handleChange} className={inputClass}>
            <option value="">Select Helper</option>
            {staff.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name} ({member.designation})
              </option>
            ))}
          </select>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Insurance Expiry</span>
            <input name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={handleChange} className={`${inputClass} w-full`} />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Pollution Expiry</span>
            <input name="pollutionExpiry" type="date" value={form.pollutionExpiry} onChange={handleChange} className={`${inputClass} w-full`} />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Fitness Expiry</span>
            <input name="fitnessExpiry" type="date" value={form.fitnessExpiry} onChange={handleChange} className={`${inputClass} w-full`} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : mode === "edit" ? "Update Vehicle" : "Create Vehicle"}
          </button>
          <Link to={`${basePath}/vehicles`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default VehicleFormPage;
