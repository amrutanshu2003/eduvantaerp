import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const BookIssueForm = ({ title, description, formData, books, students, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Book</label><select name="bookId" value={formData.bookId} onChange={onChange} className={inputClass} required><option value="">Select Book</option>{books.map((book) => <option key={book._id} value={book._id}>{book.title} ({book.availableCopies} available)</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Student</label><select name="studentId" value={formData.studentId} onChange={onChange} className={inputClass} required><option value="">Select Student</option>{students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.rollNumber})</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Issue Date</label><input type="date" name="issueDate" value={formData.issueDate} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label><input type="date" name="dueDate" value={formData.dueDate} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Fine Amount</label><input type="number" min="0" name="fineAmount" value={formData.fineAmount} onChange={onChange} className={inputClass} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Remarks</label><textarea name="remarks" value={formData.remarks} onChange={onChange} className={`${inputClass} min-h-28`} /></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : "Issue Book"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default BookIssueForm;
