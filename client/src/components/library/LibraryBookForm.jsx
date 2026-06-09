import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { bookCategoryOptions, bookStatusOptions } from "../../utils/libraryOptions";
import { formatLabel } from "../../utils/formatters";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const LibraryBookForm = ({ title, description, formData, subjects, academicGroups, onChange, onSubmit, submitting, errorMessage }) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Title</label><input name="title" value={formData.title} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Author</label><input name="author" value={formData.author} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">ISBN</label><input name="isbn" value={formData.isbn} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Category</label><select name="category" value={formData.category} onChange={onChange} className={inputClass}>{bookCategoryOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Subject</label><select name="subjectId" value={formData.subjectId} onChange={onChange} className={inputClass}><option value="">Optional Subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label><select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass}><option value="">Optional Academic Group</option>{academicGroups.map((group) => <option key={group._id} value={group._id}>{group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Publisher</label><input name="publisher" value={formData.publisher} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Edition</label><input name="edition" value={formData.edition} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Language</label><input name="language" value={formData.language} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Shelf Number</label><input name="shelfNumber" value={formData.shelfNumber} onChange={onChange} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Total Copies</label><input name="totalCopies" type="number" min="0" value={formData.totalCopies} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Available Copies</label><input name="availableCopies" type="number" min="0" value={formData.availableCopies} onChange={onChange} className={inputClass} required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" value={formData.status} onChange={onChange} className={inputClass}>{bookStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
        </div>
        <div className="mt-6 space-y-4">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : "Save Book"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default LibraryBookForm;
