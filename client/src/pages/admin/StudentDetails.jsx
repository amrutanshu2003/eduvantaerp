import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getInstituteType } from "../../utils/instituteLabels";

const StudentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const instituteType = getInstituteType(user);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await api.get(`/students/${id}`);
        setStudent(data.student);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load student");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <LoadingBlock message="Loading student details..." />;
  if (!student) return <AlertMessage tone="error" message={errorMessage} />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Student" title={student.user?.name} description="Review student login and academic details." actions={<Link to={`/admin/students/${id}/edit`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Edit Student</Link>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Roll Number</p><p className="mt-3 font-semibold text-ink">{student.rollNumber}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admission Number</p><p className="mt-3 font-semibold text-ink">{student.admissionNumber}</p></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p><div className="mt-3"><StatusBadge value={student.status} /></div></div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-card"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-3 font-semibold text-ink">{instituteType === "college" ? student.academicGroupId?.department || "-" : `${student.academicGroupId?.className || "-"} ${student.academicGroupId?.section ? `(${student.academicGroupId.section})` : ""}`}</p></div>
      </div>
    </section>
  );
};

export default StudentDetails;
