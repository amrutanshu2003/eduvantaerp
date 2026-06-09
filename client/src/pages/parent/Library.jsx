import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { Link } from "react-router-dom";

const Library = () => {
  const { user } = useAuth();
  const linkedStudents = user?.linkedStudentIds || [];

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Parent" title="Child Library" description="Choose a linked child to review issued, overdue, and returned books." />
      {linkedStudents.length === 0 ? (
        <EmptyState title="No linked children" description="Child library history will appear here when parent accounts are linked." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {linkedStudents.map((child) => (
            <Link key={child._id || child} to={`/parent/children/${child._id || child}/library`} className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <h3 className="text-xl font-semibold text-ink">{child.name || `Child ${child._id || child}`}</h3>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default Library;
