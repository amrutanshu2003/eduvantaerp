import { SkeletonBlock, SkeletonButton, SkeletonCard, SkeletonLines } from "./Skeleton";

const AppShellSkeleton = ({ message = "Preparing your workspace..." }) => {
  return (
    <div
      className="h-screen w-full max-w-full overflow-hidden md:flex"
      style={{ background: "var(--theme-app-bg)" }}
    >
      <aside className="reveal-fade-up hidden w-72 flex-shrink-0 px-5 py-6 md:flex" aria-hidden="true">
        <div className="flex min-h-0 flex-1 flex-col rounded-[2rem] bg-slate-950/92 p-5 shadow-card">
          <div className="rounded-3xl bg-white/10 p-5">
            <SkeletonBlock className="h-3 w-24 rounded-full bg-white/20" />
            <SkeletonBlock className="mt-4 h-7 w-40 rounded-full bg-white/15" />
            <SkeletonBlock className="mt-3 h-3.5 w-28 rounded-full bg-white/10" />
          </div>

          <div className="mt-8 space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <SkeletonBlock className="h-5 w-5 rounded-lg bg-white/15" />
                <SkeletonBlock className="h-3.5 flex-1 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden">
        <header className="reveal-fade-up reveal-delay-1 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" aria-hidden="true">
            <div>
              <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              <SkeletonBlock className="mt-4 h-8 w-64 rounded-full" />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <SkeletonBlock className="h-11 w-56 rounded-full" />
              <SkeletonBlock className="h-11 w-40 rounded-full" />
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonButton className="w-32" />
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="reveal-stagger space-y-6">
            <div className="skeleton-surface rounded-[2rem] p-6 shadow-card">
              <SkeletonBlock className="h-4 w-32 rounded-full" />
              <SkeletonBlock className="mt-4 h-10 w-72 rounded-full" />
              <SkeletonLines className="mt-5 max-w-3xl" lines={["w-full", "w-11/12", "w-8/12"]} />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <SkeletonCard lines={["w-10/12", "w-full", "w-7/12"]} />
              <SkeletonCard lines={["w-9/12", "w-full", "w-8/12"]} />
              <SkeletonCard lines={["w-11/12", "w-full", "w-6/12"]} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr]">
              <div className="skeleton-surface rounded-[1.75rem] p-5 shadow-card">
                <SkeletonBlock className="h-4 w-36 rounded-full" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
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
                <SkeletonCard lines={["w-full", "w-10/12", "w-7/12"]} />
                <SkeletonCard lines={["w-11/12", "w-full", "w-9/12"]} />
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">{message}</p>
        </main>
      </div>
    </div>
  );
};

export default AppShellSkeleton;
