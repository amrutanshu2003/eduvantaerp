import AlertMessage from "../AlertMessage";
import { useUISettings } from "../../context/UISettingsContext";
import { dayOptions, periodTypeOptions, timetableStatusOptions } from "../../utils/timetableOptions";
import { formatLabel } from "../../utils/formatters";
import RoundTimePicker from "../RoundTimePicker";

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const TimetableForm = ({
  title,
  description,
  formData,
  academicGroups,
  subjects,
  teachers,
  onChange,
  onPeriodChange,
  onAddPeriod,
  onRemovePeriod,
  onSubmit,
  submitting,
  errorMessage,
}) => {
  const { settings, getButtonRadius } = useUISettings();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Academic Group</label>
              <select name="academicGroupId" value={formData.academicGroupId} onChange={onChange} className={inputClass} required>
                <option value="">Select Academic Group</option>
                {academicGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.className || [group.department, group.course, group.section].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Day</label>
              <select name="dayOfWeek" value={formData.dayOfWeek} onChange={onChange} className={inputClass}>
                {dayOptions.map((day) => <option key={day} value={day}>{formatLabel(day)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={formData.status} onChange={onChange} className={inputClass}>
                {timetableStatusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-ink">Periods</h2>
            <button type="button" onClick={onAddPeriod} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Add Period
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {formData.periods.map((period, index) => {
              const availableSubjects = subjects.filter((subject) => subject.academicGroupId?._id === formData.academicGroupId || subject.academicGroupId === formData.academicGroupId);
              return (
                <div key={`${period.periodNumber}-${index}`} className="rounded-3xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-ink">Period {index + 1}</h3>
                    {formData.periods.length > 1 ? (
                      <button type="button" onClick={() => onRemovePeriod(index)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Period Number</label>
                      <input type="number" min="1" value={period.periodNumber} onChange={(event) => onPeriodChange(index, "periodNumber", event.target.value)} className={inputClass} required />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                      <select value={period.type} onChange={(event) => onPeriodChange(index, "type", event.target.value)} className={inputClass}>
                        {periodTypeOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Start Time</label>
                      <RoundTimePicker value={period.startTime} onChange={(val) => onPeriodChange(index, "startTime", val)} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">End Time</label>
                      <RoundTimePicker value={period.endTime} onChange={(val) => onPeriodChange(index, "endTime", val)} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                      <select value={period.subjectId} onChange={(event) => onPeriodChange(index, "subjectId", event.target.value)} className={inputClass} disabled={period.type === "break"}>
                        <option value="">{period.type === "break" ? "Break period" : "Select Subject"}</option>
                        {availableSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Teacher</label>
                      <select value={period.teacherId} onChange={(event) => onPeriodChange(index, "teacherId", event.target.value)} className={inputClass} disabled={period.type === "break"}>
                        <option value="">{period.type === "break" ? "Break period" : "Select Teacher"}</option>
                        {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Room Number</label>
                      <input value={period.roomNumber} onChange={(event) => onPeriodChange(index, "roomNumber", event.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
          <AlertMessage tone="error" message={errorMessage} />
          <button type="submit" disabled={submitting} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-6 py-3 text-sm font-semibold text-white">
            {submitting ? "Saving..." : "Save Timetable"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TimetableForm;
