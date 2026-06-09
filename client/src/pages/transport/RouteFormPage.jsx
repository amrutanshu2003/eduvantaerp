import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageTransport } from "../../utils/transportAccess";
import { routeStatusOptions } from "../../utils/transportOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const createEmptyStop = (stopOrder) => ({ stopName: "", pickupTime: "", dropTime: "", stopOrder });

const emptyForm = {
  routeName: "",
  routeCode: "",
  vehicleId: "",
  driverId: "",
  helperId: "",
  startPoint: "",
  endPoint: "",
  monthlyFee: "",
  status: "active",
  stops: [createEmptyStop(1)],
};

const RouteFormPage = ({ basePath, eyebrow, mode = "create" }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [vehicles, setVehicles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleResponse, supportResponse, routeResponse] = await Promise.all([
          api.get("/transport/vehicles"),
          api.get("/transport/support-data"),
          mode === "edit" ? api.get(`/transport/routes/${id}`) : Promise.resolve(null),
        ]);
        setVehicles(vehicleResponse.data.vehicles || []);
        setStaff(supportResponse.data.staff || []);

        if (routeResponse?.data?.route) {
          const route = routeResponse.data.route;
          setForm({
            routeName: route.routeName || "",
            routeCode: route.routeCode || "",
            vehicleId: route.vehicle?._id || "",
            driverId: route.driver?._id || "",
            helperId: route.helper?._id || "",
            startPoint: route.startPoint || "",
            endPoint: route.endPoint || "",
            monthlyFee: route.monthlyFee || "",
            status: route.status || "active",
            stops: route.stops?.length ? route.stops.map((stop) => ({ ...stop })) : [createEmptyStop(1)],
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load route form");
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

  const handleStopChange = (index, key, value) => {
    setForm((current) => ({
      ...current,
      stops: current.stops.map((stop, stopIndex) => (stopIndex === index ? { ...stop, [key]: value } : stop)),
    }));
  };

  const addStop = () => {
    setForm((current) => ({
      ...current,
      stops: [...current.stops, createEmptyStop(current.stops.length + 1)],
    }));
  };

  const removeStop = (index) => {
    setForm((current) => ({
      ...current,
      stops: current.stops.filter((_, stopIndex) => stopIndex !== index).map((stop, stopIndex) => ({ ...stop, stopOrder: stopIndex + 1 })),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.routeName.trim() || !form.routeCode.trim() || !form.startPoint.trim() || !form.endPoint.trim()) {
      setErrorMessage("Route name, route code, start point, and end point are required");
      return;
    }

    if (!form.stops.some((stop) => stop.stopName.trim())) {
      setErrorMessage("At least one stop is required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        ...form,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
        helperId: form.helperId || null,
        monthlyFee: Number(form.monthlyFee || 0),
        stops: form.stops.map((stop, index) => ({
          ...stop,
          stopOrder: Number(stop.stopOrder || index + 1),
        })),
      };
      const response = mode === "edit" ? await api.put(`/transport/routes/${id}`, payload) : await api.post("/transport/routes", payload);
      const nextId = response.data.route?._id || id;
      window.alert(`Route ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/routes/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save route");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading route form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Route" : "Create Route"} description="Create a transport route with ordered stops, assigned staff, and monthly fee." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="routeName" value={form.routeName} onChange={handleChange} placeholder="Route Name" className={inputClass} />
          <input name="routeCode" value={form.routeCode} onChange={handleChange} placeholder="Route Code" className={inputClass} />
          <input name="startPoint" value={form.startPoint} onChange={handleChange} placeholder="Start Point" className={inputClass} />
          <input name="endPoint" value={form.endPoint} onChange={handleChange} placeholder="End Point" className={inputClass} />
          <input name="monthlyFee" type="number" min="0" value={form.monthlyFee} onChange={handleChange} placeholder="Monthly Fee" className={inputClass} />
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {routeStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className={inputClass}>
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</option>)}
          </select>
          <select name="driverId" value={form.driverId} onChange={handleChange} className={inputClass}>
            <option value="">Select Driver</option>
            {staff.map((member) => <option key={member._id} value={member._id}>{member.name} ({member.designation})</option>)}
          </select>
          <select name="helperId" value={form.helperId} onChange={handleChange} className={inputClass}>
            <option value="">Select Helper</option>
            {staff.map((member) => <option key={member._id} value={member._id}>{member.name} ({member.designation})</option>)}
          </select>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Stops</h3>
            <button type="button" onClick={addStop} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Add Stop</button>
          </div>
          <div className="space-y-4">
            {form.stops.map((stop, index) => (
              <div key={`${stop.stopOrder}-${index}`} className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-4 md:grid-cols-4">
                <input value={stop.stopName} onChange={(event) => handleStopChange(index, "stopName", event.target.value)} placeholder="Stop Name" className={inputClass} />
                <input type="time" value={stop.pickupTime} onChange={(event) => handleStopChange(index, "pickupTime", event.target.value)} className={inputClass} />
                <input type="time" value={stop.dropTime} onChange={(event) => handleStopChange(index, "dropTime", event.target.value)} className={inputClass} />
                <div className="flex items-center gap-3">
                  <input type="number" min="1" value={stop.stopOrder} onChange={(event) => handleStopChange(index, "stopOrder", event.target.value)} placeholder="Order" className={`${inputClass} w-full`} />
                  {form.stops.length > 1 ? <button type="button" onClick={() => removeStop(index)} className="rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Remove</button> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : mode === "edit" ? "Update Route" : "Create Route"}
          </button>
          <Link to={`${basePath}/routes`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default RouteFormPage;
