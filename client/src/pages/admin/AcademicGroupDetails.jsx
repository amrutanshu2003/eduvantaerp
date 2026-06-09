import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useUISettings } from "../../context/UISettingsContext";
import { getInstituteType } from "../../utils/instituteLabels";

const AcademicGroupDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { settings, getButtonRadius } = useUISettings();
  const instituteType = getInstituteType(user);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const { data } = await api.get(`/academic-groups/${id}`);
        setGroup(data.academicGroup);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load academic group");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  if (loading) {
    return <LoadingBlock message="Loading academic group details..." />;
  }

  if (!group) {
    return <AlertMessage tone="error" message={errorMessage} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Academic Group"
        title={group.instituteType === "college" ? `${group.department} - ${group.course}` : group.className}
        description="Review the academic group configuration assigned to this institute."
        actions={
          <Link
            to={`/admin/academic-groups/${id}/edit`}
            style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
            className="px-5 py-3 text-sm font-semibold text-white"
          >
            Edit
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={group.status} /></div></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</p><p className="mt-3 font-semibold text-ink">{group.section || "-"}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</p><p className="mt-3 font-semibold text-ink">{group.instituteType}</p></div>
      </div>

      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        {group.instituteType === "college" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <p><span className="font-semibold text-ink">Program Level:</span> {group.programLevel || "-"}</p>
            <p><span className="font-semibold text-ink">Department:</span> {group.department || "-"}</p>
            <p><span className="font-semibold text-ink">Course:</span> {group.course || "-"}</p>
            <p><span className="font-semibold text-ink">Semester:</span> {group.semester || "-"}</p>
            <p><span className="font-semibold text-ink">Year:</span> {group.year || "-"}</p>
            <p><span className="font-semibold text-ink">Batch:</span> {group.batch || "-"}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <p><span className="font-semibold text-ink">School Level:</span> {group.schoolLevel || "-"}</p>
            <p><span className="font-semibold text-ink">Class Name:</span> {group.className || "-"}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AcademicGroupDetails;
