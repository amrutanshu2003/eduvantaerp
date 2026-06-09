import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatLabel } from "../../utils/formatters";
import { canManageTransport } from "../../utils/transportAccess";

const VehicleDetailsPage = ({ basePath, eyebrow }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const { data } = await api.get(`/transport/vehicles/${id}`);
        setVehicle(data.vehicle);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load vehicle");
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id]);

  if (!canManageTransport(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading vehicle details..." />;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={vehicle?.vehicleNumber || "Vehicle Details"}
        description="Review assigned transport staff and expiry records for this vehicle."
        actions={vehicle ? <Link to={`${basePath}/vehicles/${vehicle._id}/edit`} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Edit Vehicle</Link> : null}
      />
      <AlertMessage tone="error" message={errorMessage} />
      {vehicle ? (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{formatLabel(vehicle.vehicleType)}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Capacity {vehicle.capacity}</h2>
            </div>
            <StatusBadge value={vehicle.status} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p><p className="mt-2 font-semibold text-ink">{vehicle.driver?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper</p><p className="mt-2 font-semibold text-ink">{vehicle.helper?.name || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insurance Expiry</p><p className="mt-2 font-semibold text-ink">{formatDate(vehicle.insuranceExpiry)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pollution Expiry</p><p className="mt-2 font-semibold text-ink">{formatDate(vehicle.pollutionExpiry)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fitness Expiry</p><p className="mt-2 font-semibold text-ink">{formatDate(vehicle.fitnessExpiry)}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver Phone</p><p className="mt-2 font-semibold text-ink">{vehicle.driver?.phone || "-"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper Phone</p><p className="mt-2 font-semibold text-ink">{vehicle.helper?.phone || "-"}</p></div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default VehicleDetailsPage;
