import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { isDriverUser } from "../../utils/transportAccess";

const DriverStudentsPage = () => {
  const { user } = useAuth();
  const [route, setRoute] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data } = await api.get("/transport/driver/my-students");
        setRoute(data.route || null);
        setStudents(data.students || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load assigned students");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (!isDriverUser(user)) return <Navigate to="/unauthorized" replace />;
  if (loading) return <LoadingBlock message="Loading assigned students..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Driver" title="My Students" description="View pickup and drop details for students assigned to your route." />
      <AlertMessage tone="error" message={errorMessage} />
      {!route || students.length === 0 ? (
        <EmptyState title="No students assigned" description="Assigned students will appear once transport allocations are active for your route." />
      ) : (
        <div className="grid gap-4">
          {students.map((allocation) => (
            <div key={allocation._id} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{allocation.student?.name || "Student"}</h3>
                  <p className="mt-2 text-sm text-slate-600">{route.routeName} • Stop {allocation.stopName}</p>
                </div>
                <StatusBadge value={allocation.status} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pickup</p><p className="mt-2 font-semibold text-ink">{allocation.pickupTime || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Drop</p><p className="mt-2 font-semibold text-ink">{allocation.dropTime || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{allocation.student?.academicGroupId?.className || allocation.student?.academicGroupId?.course || "-"}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admission No.</p><p className="mt-2 font-semibold text-ink">{allocation.student?.admissionNumber || "-"}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DriverStudentsPage;
