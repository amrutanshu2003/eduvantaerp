import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { canManageHostel } from "../../utils/hostelAccess";

const inputClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const emptyForm = {
  studentId: "",
  hostelId: "",
  roomId: "",
  bedId: "",
  allocationDate: "",
  leavingDate: "",
  monthlyFee: "",
  securityDeposit: "",
  remarks: "",
};

const HostelAllocationFormPage = ({ basePath, eyebrow, mode = "create" }) => {
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [supportData, setSupportData] = useState({ students: [], hostels: [], rooms: [], beds: [] });
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supportResponse, allocationResponse] = await Promise.all([
          api.get("/hostel-allocations/support-data"),
          mode === "edit" ? api.get(`/hostel-allocations/${id}`) : Promise.resolve(null),
        ]);
        setSupportData({
          students: supportResponse.data.students || [],
          hostels: supportResponse.data.hostels || [],
          rooms: supportResponse.data.rooms || [],
          beds: supportResponse.data.beds || [],
        });

        if (allocationResponse?.data?.allocation) {
          const allocation = allocationResponse.data.allocation;
          setForm({
            studentId: allocation.student?._id || "",
            hostelId: allocation.hostel?._id || "",
            roomId: allocation.room?._id || "",
            bedId: allocation.bed?._id || "",
            allocationDate: allocation.allocationDate ? String(allocation.allocationDate).slice(0, 10) : "",
            leavingDate: allocation.leavingDate ? String(allocation.leavingDate).slice(0, 10) : "",
            monthlyFee: allocation.monthlyFee || "",
            securityDeposit: allocation.securityDeposit || "",
            remarks: allocation.remarks || "",
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

  const rooms = useMemo(() => supportData.rooms.filter((room) => String(room.hostelId) === String(form.hostelId)), [form.hostelId, supportData.rooms]);
  const beds = useMemo(
    () =>
      supportData.beds.filter((bed) => {
        if (mode === "edit" && String(bed._id) === String(form.bedId)) return true;
        return String(bed.roomId) === String(form.roomId);
      }),
    [form.bedId, form.roomId, mode, supportData.beds]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "hostelId" ? { roomId: "", bedId: "" } : {}),
      ...(name === "roomId" ? { bedId: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        leavingDate: form.leavingDate || null,
        monthlyFee: Number(form.monthlyFee || 0),
        securityDeposit: Number(form.securityDeposit || 0),
        remarks: form.remarks,
      };
      const response = mode === "edit"
        ? await api.put(`/hostel-allocations/${id}`, payload)
        : await api.post("/hostel-allocations", {
            ...form,
            monthlyFee: Number(form.monthlyFee || 0),
            securityDeposit: Number(form.securityDeposit || 0),
          });
      const nextId = response.data.allocation?._id || id;
      window.alert(`Hostel allocation ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/hostel-allocations/${nextId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save hostel allocation");
    } finally {
      setSaving(false);
    }
  };

  if (!canManageHostel(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading hostel allocation form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={mode === "edit" ? "Edit Hostel Allocation" : "Create Hostel Allocation"} description="Assign a student to a hostel room and bed, and maintain hostel fee details." />
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] bg-white p-6 shadow-card">
        <AlertMessage tone="error" message={errorMessage} />
        <div className="grid gap-4 md:grid-cols-2">
          {mode === "create" ? <select name="studentId" value={form.studentId} onChange={handleChange} className={inputClass}><option value="">Select Student</option>{supportData.students.map((student) => <option key={student._id} value={student._id}>{student.name || student.admissionNumber}</option>)}</select> : <input value={supportData.students.find((student) => student._id === form.studentId)?.userId?.name || "Assigned Student"} readOnly className={`${inputClass} bg-slate-50`} />}
          {mode === "create" ? <select name="hostelId" value={form.hostelId} onChange={handleChange} className={inputClass}><option value="">Select Hostel</option>{supportData.hostels.map((hostel) => <option key={hostel._id} value={hostel._id}>{hostel.hostelName}</option>)}</select> : <input value={supportData.hostels.find((hostel) => hostel._id === form.hostelId)?.hostelName || "Assigned Hostel"} readOnly className={`${inputClass} bg-slate-50`} />}
          {mode === "create" ? <select name="roomId" value={form.roomId} onChange={handleChange} className={inputClass}><option value="">Select Room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.roomNumber}</option>)}</select> : <input value={supportData.rooms.find((room) => room._id === form.roomId)?.roomNumber || "Assigned Room"} readOnly className={`${inputClass} bg-slate-50`} />}
          {mode === "create" ? <select name="bedId" value={form.bedId} onChange={handleChange} className={inputClass}><option value="">Select Bed</option>{beds.map((bed) => <option key={bed._id} value={bed._id}>{bed.bedNumber}</option>)}</select> : <input value={supportData.beds.find((bed) => bed._id === form.bedId)?.bedNumber || "Assigned Bed"} readOnly className={`${inputClass} bg-slate-50`} />}
          <label className="space-y-2 text-sm text-slate-600"><span>Allocation Date</span><input name="allocationDate" type="date" value={form.allocationDate} onChange={handleChange} readOnly={mode === "edit"} className={`${inputClass} w-full ${mode === "edit" ? "bg-slate-50" : ""}`} /></label>
          <label className="space-y-2 text-sm text-slate-600"><span>Leaving Date</span><input name="leavingDate" type="date" value={form.leavingDate} onChange={handleChange} className={`${inputClass} w-full`} /></label>
          <input name="monthlyFee" type="number" min="0" value={form.monthlyFee} onChange={handleChange} placeholder="Monthly Fee" className={inputClass} />
          <input name="securityDeposit" type="number" min="0" value={form.securityDeposit} onChange={handleChange} placeholder="Security Deposit" className={inputClass} />
          <textarea name="remarks" value={form.remarks} onChange={handleChange} placeholder="Remarks" className={`${inputClass} min-h-28 md:col-span-2`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : mode === "edit" ? "Update Allocation" : "Create Allocation"}</button>
          <Link to={`${basePath}/hostel-allocations`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default HostelAllocationFormPage;
