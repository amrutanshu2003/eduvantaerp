import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageHostel } from "../../utils/hostelAccess";
import { bedStatusOptions } from "../../utils/hostelOptions";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const BedFormPage = ({ basePath, eyebrow, mode = "create", nested = false }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id, roomId } = useParams();
  const [form, setForm] = useState({ roomId: roomId || "", bedNumber: "", status: "available" });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supportResponse, bedResponse] = await Promise.all([
          api.get("/hostels/support-data"),
          mode === "edit" ? api.get(`/hostel-beds/${id}`) : Promise.resolve(null),
        ]);
        setRooms(supportResponse.data.rooms || []);
        if (bedResponse?.data?.bed) {
          const bed = bedResponse.data.bed;
          setForm({
            roomId: bed.room?._id || "",
            bedNumber: bed.bedNumber || "",
            status: bed.status === "occupied" ? "available" : bed.status || "available",
          });
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load bed form");
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
    if (!form.roomId || !form.bedNumber.trim()) {
      setErrorMessage("Room and bed number are required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = { bedNumber: form.bedNumber, status: form.status };
      const response = mode === "edit" ? await api.put(`/hostel-beds/${id}`, payload) : await api.post(`/hostel-rooms/${form.roomId}/beds`, payload);
      const nextId = response.data.bed?._id || id;
      window.alert(`Bed ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/hostel-beds/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save bed");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading bed form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Bed" : "Create Bed"} description="Add room-wise bed setup while keeping room capacity and status aligned." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          {!nested ? <select name="roomId" value={form.roomId} onChange={handleChange} className={inputClass}><option value="">Select Room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.roomNumber}</option>)}</select> : null}
          <input name="bedNumber" value={form.bedNumber} onChange={handleChange} placeholder="Bed Number" className={inputClass} />
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>{bedStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : mode === "edit" ? "Update Bed" : "Create Bed"}</button>
          <Link to={nested ? `${basePath}/hostel-rooms/${roomId}/beds` : `${basePath}/hostel-beds`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default BedFormPage;
