const joinClasses = (...values) => values.filter(Boolean).join(" ");

export const SkeletonBlock = ({ className = "" }) => (
  <div aria-hidden="true" className={joinClasses("skeleton-block", className)} />
);

export const SkeletonLines = ({ lines = ["w-full", "w-5/6", "w-2/3"], className = "" }) => (
  <div className={joinClasses("space-y-3", className)} aria-hidden="true">
    {lines.map((lineClass, index) => (
      <SkeletonBlock key={`${lineClass}-${index}`} className={joinClasses("h-3.5 rounded-full", lineClass)} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = "", lines, header = true }) => (
  <div className={joinClasses("skeleton-surface rounded-[1.75rem] p-5 shadow-card", className)}>
    {header ? <SkeletonBlock className="h-4 w-28 rounded-full" /> : null}
    <SkeletonLines className={header ? "mt-4" : ""} lines={lines} />
  </div>
);

export const SkeletonButton = ({ className = "" }) => (
  <SkeletonBlock className={joinClasses("h-11 rounded-full", className)} />
);

export default SkeletonBlock;
