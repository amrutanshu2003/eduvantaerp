import { useEffect, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const UploadMarks = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({ examId: "", subjectId: "", academicGroupId: "", totalMarks: 100, passingMarks: 33, status: "draft" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: subjectsData }, { data: examsData }] = await Promise.all([api.get("/subjects"), api.get("/exams")]);
        setSubjects(subjectsData.subjects);
        setExams(examsData.exams);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load marks form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const selectedSubject = subjects.find((subject) => subject._id === formData.subjectId);
    if (selectedSubject) {
      setFormData((current) => ({
        ...current,
        academicGroupId: selectedSubject.academicGroupId?._id || selectedSubject.academicGroupId || "",
        totalMarks: selectedSubject.totalMarks || 100,
        passingMarks: selectedSubject.passingMarks || 33,
      }));
    }
  }, [formData.subjectId, subjects]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.academicGroupId) return;
      const { data } = await api.get("/students", { params: { academicGroupId: formData.academicGroupId } });
      setStudents(data.students);
      setRecords(data.students.map((student) => ({ studentId: student._id, marksObtained: "", remarks: "" })));
    };
    loadStudents();
  }, [formData.academicGroupId]);

  const updateRecord = (studentId, key, value) => {
    setRecords((current) => current.map((record) => (record.studentId === studentId ? { ...record, [key]: value } : record)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      for (const record of records) {
        if (record.marksObtained === "") continue;
        await api.post("/marks", {
          examId: formData.examId,
          subjectId: formData.subjectId,
          academicGroupId: formData.academicGroupId,
          studentId: record.studentId,
          marksObtained: Number(record.marksObtained),
          totalMarks: Number(formData.totalMarks),
          passingMarks: Number(formData.passingMarks),
          remarks: record.remarks,
          status: formData.status,
        });
      }
      window.alert("Marks uploaded successfully");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to upload marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading marks upload form..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Upload Marks" description="Select exam and subject, then enter marks for each student." />
      <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-4">
          <select value={formData.examId} onChange={(event) => setFormData((current) => ({ ...current, examId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="">Select Exam</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.examName}</option>)}</select>
          <select value={formData.subjectId} onChange={(event) => setFormData((current) => ({ ...current, subjectId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="">Select Subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}</select>
          <input type="number" value={formData.totalMarks} onChange={(event) => setFormData((current) => ({ ...current, totalMarks: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Total Marks" />
          <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"><option value="draft">Draft</option><option value="submitted">Submitted</option></select>
        </div>
        <div className="mt-6 space-y-4">{students.map((student) => <div key={student._id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.5fr_1fr_1fr]"><div><p className="font-medium text-ink">{student.user?.name}</p><p className="text-xs text-slate-500">{student.rollNumber}</p></div><input type="number" value={records.find((record) => record.studentId === student._id)?.marksObtained || ""} onChange={(event) => updateRecord(student._id, "marksObtained", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Marks" /><input value={records.find((record) => record.studentId === student._id)?.remarks || ""} onChange={(event) => updateRecord(student._id, "remarks", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Remarks" /></div>)}</div>
        <div className="mt-6 space-y-4"><AlertMessage tone="error" message={errorMessage} /><button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">{submitting ? "Uploading..." : "Upload Marks"}</button></div>
      </form>
    </section>
  );
};

export default UploadMarks;
