import { SkeletonBlock, SkeletonButton, SkeletonCard, SkeletonLines } from "./Skeleton";

const LoadingBlock = ({ message = "Loading..." }) => {
  return (
    <div className="space-y-6">
      <div className="skeleton-surface rounded-[2rem] p-6 shadow-card">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <SkeletonBlock className="mt-4 h-10 w-72 max-w-full rounded-[1rem]" />
        <SkeletonLines className="mt-5 max-w-3xl" lines={["w-full", "w-10/12", "w-8/12"]} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SkeletonCard lines={["w-11/12", "w-full", "w-7/12"]} />
        <SkeletonCard lines={["w-10/12", "w-full", "w-8/12"]} />
        <SkeletonCard lines={["w-9/12", "w-full", "w-6/12"]} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="skeleton-surface rounded-[1.75rem] p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-4 w-36 rounded-full" />
            <SkeletonButton className="w-28" />
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-100 px-4 py-4">
                <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                <div className="flex-1">
                  <SkeletonBlock className="h-3.5 w-5/12 rounded-full" />
                  <SkeletonBlock className="mt-3 h-3.5 w-9/12 rounded-full" />
                </div>
                <SkeletonBlock className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SkeletonCard lines={["w-full", "w-10/12", "w-8/12"]} />
          <SkeletonCard lines={["w-11/12", "w-full", "w-7/12"]} />
        </div>
      </div>

      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};

export default LoadingBlock;
