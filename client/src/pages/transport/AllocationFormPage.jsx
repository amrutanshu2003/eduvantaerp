import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageTransport } from "../../utils/transportAccess";
import { allocationStatusOptions } from "../../utils/transportOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const emptyForm = {
  studentId: "",
  routeId: "",
  stopName: "",
  pickupTime: "",
  dropTime: "",
  monthlyFee: "",
  startDate: "",
  endDate: "",
  status: "active",
};

const AllocationFormPage = ({ basePath, eyebrow, mode = "create" }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routeResponse, supportResponse, allocationResponse] = await Promise.all([
          api.get("/transport/routes"),
          api.get("/transport/support-data"),
          mode === "edit" ? api.get(`/transport/allocations/${id}`) : Promise.resolve(null),
        ]);
        setRoutes(routeResponse.data.routes || []);
        setStudents(supportResponse.data.students || []);

        if (allocationResponse?.data?.allocation) {
          const allocation = allocationResponse.data.allocation;
          setForm({
            studentId: allocation.student?._id || "",
            routeId: allocation.route?._id || "",
            stopName: allocation.stopName || "",
            pickupTime: allocation.pickupTime || "",
            dropTime: allocation.dropTime || "",
            monthlyFee: allocation.monthlyFee || "",
            startDate: allocation.startDate ? String(allocation.startDate).slice(0, 10) : "",
            endDate: allocation.endDate ? String(allocation.endDate).slice(0, 10) : "",
            status: allocation.status || "active",
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load allocation form");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, mode]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route._id === form.routeId),
    [form.routeId, routes]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextRoute = name === "routeId" ? routes.find((route) => route._id === value) : selectedRoute;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "routeId"
        ? {
            stopName: "",
            pickupTime: "",
            dropTime: "",
            monthlyFee: value ? nextRoute?.monthlyFee || "" : "",
          }
        : {}),
    }));
  };

  const handleStopChange = (value) => {
    const stop = selectedRoute?.stops?.find((entry) => entry.stopName === value);
    setForm((current) => ({
      ...current,
      stopName: value,
      pickupTime: stop?.pickupTime || current.pickupTime,
      dropTime: stop?.dropTime || current.dropTime,
      monthlyFee: current.monthlyFee || selectedRoute?.monthlyFee || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.studentId || !form.routeId || !form.stopName || !form.startDate) {
      setErrorMessage("Student, route, stop, and start date are required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        ...form,
        monthlyFee: Number(form.monthlyFee || 0),
        endDate: form.endDate || null,
      };
      const response = mode === "edit" ? await api.put(`/transport/allocations/${id}`, payload) : await api.post("/transport/allocations", payload);
      const nextId = response.data.allocation?._id || id;
      window.alert(`Allocation ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/allocations/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save allocation");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading allocation form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Allocation" : "Create Allocation"} description="Allocate a student to a route stop and keep fee, pickup, and drop timing in sync." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          <select name="studentId" value={form.studentId} onChange={handleChange} className={inputClass}>
            <option value="">Select Student</option>
            {students.map((student) => <option key={student._id} value={student._id}>{student.name || student.admissionNumber}</option>)}
          </select>
          <select name="routeId" value={form.routeId} onChange={handleChange} className={inputClass}>
            <option value="">Select Route</option>
            {routes.map((route) => <option key={route._id} value={route._id}>{route.routeName} ({route.routeCode})</option>)}
          </select>
          <select name="stopName" value={form.stopName} onChange={(event) => handleStopChange(event.target.value)} className={inputClass}>
            <option value="">Select Stop</option>
            {(selectedRoute?.stops || []).map((stop) => <option key={`${stop.stopName}-${stop.stopOrder}`} value={stop.stopName}>{stop.stopName}</option>)}
          </select>
          <input name="monthlyFee" type="number" min="0" value={form.monthlyFee} onChange={handleChange} placeholder="Monthly Fee" className={inputClass} />
          <input name="pickupTime" type="time" value={form.pickupTime} onChange={handleChange} className={inputClass} />
          <input name="dropTime" type="time" value={form.dropTime} onChange={handleChange} className={inputClass} />
          <label className="space-y-2 text-sm text-slate-600">
            <span>Start Date</span>
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={`${inputClass} w-full`} />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>End Date</span>
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={`${inputClass} w-full`} />
          </label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {allocationStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : mode === "edit" ? "Update Allocation" : "Create Allocation"}
          </button>
          <Link to={`${basePath}/allocations`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default AllocationFormPage;
