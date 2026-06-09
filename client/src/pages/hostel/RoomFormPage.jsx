import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageHostel } from "../../utils/hostelAccess";
import { roomStatusOptions, roomTypeOptions } from "../../utils/hostelOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const emptyForm = {
  hostelId: "",
  roomNumber: "",
  floorNumber: "",
  roomType: "single",
  capacity: "",
  status: "available",
};

const RoomFormPage = ({ basePath, eyebrow, mode = "create", nested = false }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id, hostelId } = useParams();
  const [form, setForm] = useState({ ...emptyForm, hostelId: hostelId || "" });
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supportResponse, roomResponse] = await Promise.all([
          api.get("/hostels/support-data"),
          mode === "edit" ? api.get(`/hostel-rooms/${id}`) : Promise.resolve(null),
        ]);
        setHostels(supportResponse.data.hostels || []);
        if (roomResponse?.data?.room) {
          const room = roomResponse.data.room;
          setForm({
            hostelId: room.hostel?._id || "",
            roomNumber: room.roomNumber || "",
            floorNumber: room.floorNumber || "",
            roomType: room.roomType || "single",
            capacity: room.capacity || "",
            status: room.status || "available",
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load room form");
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
    if (!form.hostelId || !form.roomNumber.trim() || form.floorNumber === "" || !form.capacity) {
      setErrorMessage("Hostel, room number, floor number, and capacity are required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        roomNumber: form.roomNumber,
        floorNumber: Number(form.floorNumber),
        roomType: form.roomType,
        capacity: Number(form.capacity),
        status: form.status,
      };
      const response = mode === "edit"
        ? await api.put(`/hostel-rooms/${id}`, payload)
        : await api.post(`/hostels/${form.hostelId}/rooms`, payload);
      const nextId = response.data.room?._id || id;
      window.alert(`Room ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/hostel-rooms/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save room");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading room form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Room" : "Create Room"} description="Add room capacity, floor, and room type under a hostel." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          {!nested ? <select name="hostelId" value={form.hostelId} onChange={handleChange} className={inputClass}><option value="">Select Hostel</option>{hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.hostelName}</option>)}</select> : null}
          <input name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="Room Number" className={inputClass} />
          <input name="floorNumber" type="number" min="0" value={form.floorNumber} onChange={handleChange} placeholder="Floor Number" className={inputClass} />
          <select name="roomType" value={form.roomType} onChange={handleChange} className={inputClass}>{roomTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} placeholder="Capacity" className={inputClass} />
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>{roomStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : mode === "edit" ? "Update Room" : "Create Room"}</button>
          <Link to={nested ? `${basePath}/hostels/${hostelId}/rooms` : `${basePath}/hostel-rooms`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default RoomFormPage;
