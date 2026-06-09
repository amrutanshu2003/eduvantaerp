import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";

const DetailCard = ({ label, value }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-ink">{value || "Not provided"}</p>
  </div>
);

const InstituteDetails = () => {
  const { id } = useParams();
  const { settings, getButtonRadius } = useUISettings();
  const [institute, setInstitute] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const { data } = await api.get(`/institutes/${id}`);
        setInstitute(data.institute);
        setAdmins(data.admins);
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load institute");
      } finally {
        setLoading(false);
      }
    };

    fetchInstitute();
  }, [id]);

  if (loading) {
    return <LoadingBlock message="Loading institute profile..." />;
  }

  if (!institute) {
    return <AlertMessage tone="error" message={message || "Institute not found"} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Institute Details"
        title={institute.name}
        description="View institute profile, subscription state and the linked admin accounts."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to={`/super-admin/institutes/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              Edit Institute
            </Link>
            <Link
              to={`/super-admin/institutes/${id}/create-admin`}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-4 py-3 text-sm font-semibold text-white"
            >
              Create Admin
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailCard label="Institute Code" value={institute.instituteCode} />
        <DetailCard label="Email" value={institute.email} />
        <DetailCard label="Phone" value={institute.phone} />
        <DetailCard label="Head Name" value={institute.headName} />
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="flex flex-wrap gap-3">
          <StatusBadge value={institute.instituteType} />
          <StatusBadge value={institute.status} />
          <StatusBadge value={institute.plan} />
          <StatusBadge value={institute.paymentStatus} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">{institute.address || "No address added yet."}</p>
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Institute Admins</h2>
        <p className="mt-2 text-sm text-slate-500">Admins created for this institute appear here.</p>

        {admins.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No admins yet" description="Create the first institute admin to hand over institute-level access." />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{admin.name}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.phone || "-"}</td>
                    <td className="px-4 py-3"><StatusBadge value={admin.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default InstituteDetails;
