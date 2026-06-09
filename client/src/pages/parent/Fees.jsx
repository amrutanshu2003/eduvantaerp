import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";

const Fees = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFees = async () => {
      try {
        const linkedStudents = user?.linkedStudentIds || [];
        const responses = await Promise.all(
          linkedStudents.map((child) => api.get(`/fees/child/${child._id || child}`))
        );

        const nextChildren = responses.map((response, index) => ({
          id: linkedStudents[index]._id || linkedStudents[index],
          name: response.data.fees?.[0]?.studentId?.userId?.name || linkedStudents[index].name || `Child ${index + 1}`,
          fees: response.data.fees || [],
        }));

        setChildren(nextChildren);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load child fees");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, [user]);

  if (loading) return <LoadingBlock message="Loading child fees..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Parent" title="Child Fees" description="Choose a linked child to review assigned fees and payment status." />
      <AlertMessage tone="error" message={errorMessage} />
      {children.length === 0 ? (
        <EmptyState title="No linked children" description="Linked child fees will appear here when parent accounts are mapped." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <Link key={child.id} to={`/parent/children/${child.id}/fees`} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <h3 className="text-xl font-semibold text-ink">{child.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{child.fees.length} fee record(s)</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default Fees;
