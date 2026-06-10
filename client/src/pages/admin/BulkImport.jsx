import { useMemo, useState } from "react";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const templates = {
  academic_groups: {
    label: "Academic Groups",
    description:
      "For schools, fill `school_level,class_name,section`. For colleges or universities, fill `program_level,department,course,section`.",
    csv: `school_level,class_name,section,mentor_teacher_email,status
Secondary,10,A,teacher1@school.com,active`,
  },
  teachers: {
    label: "Teachers",
    description: "Required columns: name, email, password. All other fields are optional.",
    csv: `name,email,password,phone,employee_id,qualification,experience,department,status
Sara Khan,sara.khan@school.com,Teacher@123,9876543210,TCH-001,MSc Physics,5 years,Science,active`,
  },
  students: {
    label: "Students",
    description:
      "To link a student to an academic group, include that group's columns in the same row, such as `school_level,class_name,section` for schools or `program_level,department,course,section` for colleges/universities.",
    csv: `name,email,password,phone,roll_number,admission_number,registration_number,dob,gender,blood_group,address,admission_date,school_level,class_name,section,status
Ali Raza,ali.raza@student.com,Student@123,9876543201,12,ADM-1001,REG-501,2010-04-12,male,B+,Lahore,2026-04-01,Secondary,10,A,active`,
  },
  parents: {
    label: "Parents",
    description:
      "For multiple linked students, separate values in `linked_student_admission_numbers` or `linked_student_roll_numbers` using `|`.",
    csv: `name,email,password,phone,relation,address,linked_student_admission_numbers,status
Ahmed Raza,ahmed.raza@parent.com,Parent@123,9876543202,father,Lahore,ADM-1001|ADM-1002,active`,
  },
  staff: {
    label: "Staff",
    description:
      "Use the exact designation enum value, such as `librarian`, `driver`, or `hostel_warden`. Separate multiple permissions with `|`.",
    csv: `name,email,password,phone,staff_id,designation,department,joining_date,salary,address,permissions,status
Nadia Khan,nadia.khan@school.com,Staff@123,9876543203,STF-201,librarian,Library,2026-05-01,35000,Campus,library.manage,active`,
  },
  subjects: {
    label: "Subjects",
    description:
      "To map a subject to an academic group, provide the same group columns. Use `teacher_email` if you want to assign a teacher.",
    csv: `subject_name,subject_code,subject_type,total_marks,passing_marks,teacher_email,school_level,class_name,section,status
Mathematics,MATH-10-A,core,100,33,sara.khan@school.com,Secondary,10,A,active`,
  },
};

const BulkImport = () => {
  const { settings, getButtonRadius } = useUISettings();
  const [entityType, setEntityType] = useState("students");
  const [csvText, setCsvText] = useState(templates.students.csv);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [result, setResult] = useState(null);

  const activeTemplate = useMemo(() => templates[entityType], [entityType]);

  const handleEntityTypeChange = (event) => {
    const nextEntityType = event.target.value;
    setEntityType(nextEntityType);
    setCsvText(templates[nextEntityType].csv);
    setResult(null);
    setMessage("");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setMessage(`Loaded ${file.name}`);
    setMessageTone("info");
  };

  const downloadTemplate = () => {
    const blob = new Blob([activeTemplate.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityType}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setResult(null);
      const { data } = await api.post("/bulk-import", { entityType, csvText });
      setResult(data);
      setMessageTone(data.failureCount > 0 ? "info" : "success");
      setMessage(data.message);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Bulk import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Bulk Import"
        description="Add records in bulk with CSV instead of entering everything one by one. Each row is validated, and failed rows show exact errors below."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Import Type</span>
              <select
                value={entityType}
                onChange={handleEntityTypeChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              >
                {Object.entries(templates).map(([value, template]) => (
                  <option key={value} value={value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-[0.8rem] text-sm outline-none"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">{activeTemplate.label} template note</p>
            <p className="mt-2 leading-6">{activeTemplate.description}</p>
            <p className="mt-2 leading-6">If a cell needs multiple values, use `|`, for example `ADM-1|ADM-2`.</p>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>CSV Data</span>
            <textarea
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              rows={18}
              className="w-full rounded-3xl border border-slate-200 px-4 py-4 font-mono text-xs leading-6 outline-none"
              placeholder="Paste CSV data here..."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
              className="px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Importing..." : "Start Bulk Import"}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Download Template
            </button>
          </div>
        </form>

        <div className="space-y-5 rounded-[1.75rem] bg-white p-6 shadow-card">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">How It Works</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Import Summary</h2>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p>1. Download the template or modify the sample.</p>
            <p>2. Paste the CSV or upload a file.</p>
            <p>3. After import, successful and failed rows are shown separately.</p>
            <p>4. Fix failed rows and run the import again.</p>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rows</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{result.totalRows}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Success</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-700">{result.successCount}</p>
                </div>
                <div className="rounded-3xl bg-rose-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-500">Failed</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-700">{result.failureCount}</p>
                </div>
              </div>

              <div className="max-h-[28rem] overflow-auto rounded-3xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Row</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item) => (
                      <tr key={`${item.rowNumber}-${item.status}`} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3 font-medium text-ink">{item.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === "success"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.error || item.summary || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
              Row-wise results will appear here after the import runs.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BulkImport;
