import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import { isDriverUser } from "../../utils/transportAccess";

const DriverRoutePage = () => {
  const { user } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const { data } = await api.get("/transport/driver/my-route");
        setRoute(data.route);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assigned route");
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, []);

  if (!isDriverUser(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading assigned route..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Driver" title="My Route" description="Review your assigned route, stops, and transport staff details." />
      <AlertMessage tone="error" message={errorMessage} />
      {!route ? (
        <EmptyState title="No route assigned" description="Assigned driver route details will appear here." />
      ) : (
        <>
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{route.routeCode}</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{route.routeName}</h2>
              </div>
              <StatusBadge value={route.status} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vehicle</p><p className="mt-2 font-semibold text-ink">{route.vehicle?.vehicleNumber || "-"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Helper</p><p className="mt-2 font-semibold text-ink">{route.helper?.name || "-"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Travel Path</p><p className="mt-2 font-semibold text-ink">{route.startPoint} to {route.endPoint}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p><p className="mt-2 font-semibold text-ink">{formatCurrency(route.monthlyFee)}</p></div>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
            <h3 className="text-xl font-semibold text-ink">Stop List</h3>
            <div className="mt-4 grid gap-3">
              {route.stops?.map((stop) => (
                <div key={`${stop.stopName}-${stop.stopOrder}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">Stop {stop.stopOrder}</p>
                      <h4 className="mt-1 font-semibold text-ink">{stop.stopName}</h4>
                    </div>
                    <div className="text-sm text-slate-600">Pickup {stop.pickupTime || "-"} • Drop {stop.dropTime || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default DriverRoutePage;
