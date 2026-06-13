import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Select, FormSection, FormField, FormActionBar } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";

const formDefaults = {
  name: "",
  email: "",
  phone: "",
  password: "",
  instituteId: "",
  status: "active",
  permissions: "students.view,students.create,students.update,ui.customize,library.manage,transport.manage,hostel.manage",
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

const CreateAdmin = () => {
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [formData, setFormData] = useState(formDefaults);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const { data } = await api.get("/institutes");
        const activeInstitutes = data.institutes.filter((inst) => inst.status === "active");
        setInstitutes(activeInstitutes);
        if (activeInstitutes.length > 0) {
          setFormData((curr) => ({ ...curr, instituteId: activeInstitutes[0]._id }));
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load institutes");
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutes();
  }, []);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.post("/admin/admins", {
        ...formData,
        permissions: formData.permissions
          .split(",")
          .map((permission) => permission.trim())
          .filter(Boolean),
      });
      window.alert("Admin created successfully");
      navigate("/super-admin/admins");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create admin user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading active institutes list..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Create Admin"
        description="Add a new institute admin account and link it to an active institute."
      />
      <form onSubmit={handleSubmit}>
        <FormSection title="Basic Information">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Email" required helperText="Used for login">
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Phone" helperText="10 digit mobile number">
              <Input
                name="phone"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Phone number must be exactly 10 digits"
                value={formData.phone}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Password" required helperText="Minimum 8 characters">
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Institute & Permissions">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Institute" required helperText="Select the institute to link this admin to">
              <Select
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                required
              >
                {institutes.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.instituteCode})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Permissions" helperText="Comma-separated values like `students.view, ui.customize`">
            <textarea
              name="permissions"
              rows="4"
              value={formData.permissions}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </FormField>
        </FormSection>

        <FormSection>
          <div className="space-y-4">
            <AlertMessage tone="error" message={errorMessage} />
            <FormActionBar
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Create Admin User"
              onCancel={() => navigate("/super-admin/admins")}
            />
          </div>
        </FormSection>
      </form>
    </section>
  );
};

export default CreateAdmin;
