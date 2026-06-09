import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import { formatDate, formatLabel } from "../utils/formatters";

const LatestNoticesPanel = ({ title = "Latest Notices", description = "Recent updates shared with you.", notices = [] }) => {
  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No notices yet" description="Targeted notices will appear here when they are published." />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {notices.map((notice) => (
            <article key={notice._id} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={notice.priority} />
                <StatusBadge value={notice.noticeType} />
                {notice.audience ? <StatusBadge value={formatLabel(notice.audience)} /> : null}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{notice.title}</h3>
              {notice.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{notice.description}</p> : null}
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">Published {formatDate(notice.publishDate)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestNoticesPanel;
