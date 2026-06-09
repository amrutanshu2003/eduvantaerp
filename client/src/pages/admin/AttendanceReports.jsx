import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";

const AttendanceReports = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const { data } = await api.get("/academic-groups");
        setGroups(data.academicGroups);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load academic groups");
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const fetchReport = async () => {
    if (!selectedGroup) return;
    const { data } = await api.get(`/attendance/reports/academic-group/${selectedGroup}`);
    setReport(data);
  };

  if (loading) return <LoadingBlock message="Loading attendance reports..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Attendance Reports" description="Review attendance summaries by academic group." />
      <AlertMessage tone="error" message={errorMessage} />
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row">
          <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            <option value="">Select Academic Group</option>
            {groups.map((group) => <option key={group._id} value={group._id}>{group.className || `${group.department} - ${group.course}`}</option>)}
          </select>
          <button type="button" onClick={fetchReport} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Load Report</button>
        </div>
      </div>
      {report ? (
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Student ID</th>
                  <th className="px-6 py-4 font-medium">Present</th>
                  <th className="px-6 py-4 font-medium">Absent</th>
                  <th className="px-6 py-4 font-medium">Late</th>
                  <th className="px-6 py-4 font-medium">Leave</th>
                  <th className="px-6 py-4 font-medium">Percentage</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((item) => (
                  <tr key={item.studentId} className="border-t border-slate-100">
                    <td className="px-6 py-4 text-slate-600">{item.studentId}</td>
                    <td className="px-6 py-4 text-slate-600">{item.present}</td>
                    <td className="px-6 py-4 text-slate-600">{item.absent}</td>
                    <td className="px-6 py-4 text-slate-600">{item.late}</td>
                    <td className="px-6 py-4 text-slate-600">{item.leave}</td>
                    <td className="px-6 py-4 text-slate-600">{item.percentage}%</td>
                    <td className="px-6 py-4">
                      <Link to={`/admin/attendance/students/${item.studentId}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View Student</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AttendanceReports;
