import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
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
      <form onSubmit={handleSubmit}>
        <FormSection>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Hostel Name" required>
              <Input
                name="hostelName"
                value={form.hostelName}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Hostel Code" required>
              <Input
                name="hostelCode"
                value={form.hostelCode}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Hostel Type" required>
              <Select
                name="hostelType"
                value={form.hostelType}
                onChange={handleChange}
                required
              >
                {hostelTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </FormField>
            <FormField label="Total Floors" required helperText="Number of floors in the hostel">
              <Input
                name="totalFloors"
                type="number"
                min="1"
                value={form.totalFloors}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Warden" helperText="Assign a hostel warden">
              <Select
                name="wardenId"
                value={form.wardenId}
                onChange={handleChange}
              >
                <option value="">Select Warden</option>
                {staff.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Contact Number" helperText="Warden contact number">
              <Input
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Status">
              <Select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                {hostelStatusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </FormField>
            <FormField label="Address" className="md:col-span-2">
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection>
          <div className="space-y-4">
            <AlertMessage tone="error" message={errorMessage} />
            <FormActionBar
              onSubmit={handleSubmit}
              submitting={saving}
              submitLabel={mode === "edit" ? "Update Hostel" : "Create Hostel"}
              onCancel={() => navigate(`${basePath}/hostels`)}
            />
          </div>
        </FormSection>
      </form>
    </section>
  );
};

export default HostelFormPage;
