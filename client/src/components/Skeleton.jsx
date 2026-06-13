const joinClasses = (...values) => values.filter(Boolean).join(" ");

export const SkeletonBlock = ({ className = "" }) => (
  <div aria-hidden="true" className={joinClasses("skeleton-block", className)} />
);

export const Skeleton = SkeletonBlock;

export const SkeletonLine = ({ className = "" }) => (
  <SkeletonBlock className={joinClasses("h-3.5 rounded-md", className)} />
);

export const SkeletonLines = ({ lines = ["w-full", "w-5/6", "w-2/3"], className = "" }) => (
  <div className={joinClasses("space-y-3", className)} aria-hidden="true">
    {lines.map((lineClass, index) => (
      <SkeletonLine key={`${lineClass}-${index}`} className={lineClass} />
    ))}
  </div>
);

export const SkeletonAvatar = ({ className = "", size = "md" }) => {
  const sizeClassMap = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    xl: "h-16 w-16",
  };

  return <SkeletonBlock className={joinClasses("rounded-full", sizeClassMap[size] || sizeClassMap.md, className)} />;
};

export const SkeletonCard = ({ className = "", lines, header = true }) => (
  <div className={joinClasses("skeleton-surface rounded-2xl p-5 shadow-card", className)}>
    {header ? <SkeletonLine className="h-4 w-28" /> : null}
    <SkeletonLines className={header ? "mt-4" : ""} lines={lines} />
  </div>
);

export const SkeletonButton = ({ className = "" }) => (
  <SkeletonBlock className={joinClasses("h-11 rounded-full", className)} />
);

export const SkeletonTable = ({
  className = "",
  columns = 4,
  rows = 5,
  showHeader = true,
}) => (
  <div className={joinClasses("skeleton-surface overflow-hidden rounded-2xl shadow-card", className)} aria-hidden="true">
    {showHeader ? (
      <div className="grid gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/80" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonLine key={`header-${index}`} className="h-3.5 w-8/12" />
        ))}
      </div>
    ) : null}
    <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 px-5 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <SkeletonLine
              key={`cell-${rowIndex}-${columnIndex}`}
              className={columnIndex === 0 ? "h-3.5 w-10/12" : columnIndex === columns - 1 ? "h-3.5 w-6/12" : "h-3.5 w-8/12"}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
