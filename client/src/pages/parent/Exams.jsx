import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";

const Exams = () => {
  const { user } = useAuth();
  return <section className="space-y-6"><PageHeader eyebrow="Parent" title="Child Exams" description="Review child exam activity." /><div className="rounded-[1.75rem] bg-white p-6 shadow-card"><p className="text-sm text-slate-600">Linked children count: {user?.linkedStudentIds?.length || 0}</p></div></section>;
};

export default Exams;
