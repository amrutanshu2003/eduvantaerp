import { Link } from "react-router-dom";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";

const Results = () => {
  const { user } = useAuth();
  const linkedStudents = user?.linkedStudentIds || [];

  return <section className="space-y-6"><PageHeader eyebrow="Parent" title="Child Results" description="Choose a linked child to review published results." /><AlertMessage tone="error" message="" />{linkedStudents.length === 0 ? <EmptyState title="No linked children" description="Linked child results will appear here." /> : <div className="grid gap-4 md:grid-cols-2">{linkedStudents.map((child) => <Link key={child._id || child} to={`/parent/children/${child._id || child}/results`} className="rounded-[1.5rem] bg-white p-6 shadow-card"><h3 className="text-xl font-semibold text-ink">{child.name || `Child ${child._id || child}`}</h3></Link>)}</div>}</section>;
};

export default Results;
