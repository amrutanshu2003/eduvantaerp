import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";

const Timetable = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const linkedStudents = user?.linkedStudentIds || [];
        const responses = await Promise.all(linkedStudents.map((child) => api.get(`/timetables/child/${child._id || child}`)));
        setChildren(responses.map((response, index) => ({ id: linkedStudents[index]._id || linkedStudents[index], name: response.data.timetables?.[0]?.academicGroupId?.className || linkedStudents[index].name || `Child ${index + 1}`, timetables: response.data.timetables || [] })));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load child timetables");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingBlock message="Loading child timetables..." />;

  return <section className="space-y-6"><PageHeader eyebrow="Parent" title="Child Timetable" description="Choose a linked child to review today's class schedule." /><AlertMessage tone="error" message={errorMessage} />{children.length === 0 ? <EmptyState title="No linked children" description="Linked child timetable will appear here." /> : <div className="grid gap-4 md:grid-cols-2">{children.map((child) => <Link key={child.id} to={`/parent/children/${child.id}/timetable`} className="rounded-[1.75rem] bg-white p-6 shadow-card"><h3 className="text-xl font-semibold text-ink">{child.name}</h3><p className="mt-2 text-sm text-slate-600">{child.timetables.length} day schedule(s)</p></Link>)}</div>}</section>;
};

export default Timetable;
