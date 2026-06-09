import { SkeletonBlock, SkeletonButton, SkeletonLines } from "./Skeleton";

const LoginSkeleton = ({ message = "Loading login experience..." }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-4 sm:px-6 sm:py-5">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-card lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal-fade-up relative overflow-hidden px-6 py-7 text-white sm:px-8 sm:py-8 lg:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0f172a_0%,#0f766e_100%)]" />
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col gap-6" aria-hidden="true">
            <div>
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-2xl bg-white/15" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-3 w-32 rounded-full bg-white/20" />
                  <SkeletonBlock className="h-3 w-36 rounded-full bg-white/10" />
                </div>
              </div>

              <SkeletonBlock className="mt-8 h-10 w-10/12 rounded-[1rem] bg-white/15 sm:h-14" />
              <SkeletonBlock className="mt-4 h-10 w-8/12 rounded-[1rem] bg-white/12 sm:h-14" />
              <SkeletonLines
                className="mt-6 max-w-xl"
                lines={["w-full bg-white/10", "w-11/12 bg-white/10", "w-9/12 bg-white/10"]}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <SkeletonBlock className="h-4 w-28 rounded-full bg-white/15" />
                <SkeletonLines className="mt-4" lines={["w-full bg-white/10", "w-10/12 bg-white/10", "w-8/12 bg-white/10"]} />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <SkeletonBlock className="h-4 w-28 rounded-full bg-white/15" />
                <SkeletonLines className="mt-4" lines={["w-full bg-white/10", "w-10/12 bg-white/10", "w-8/12 bg-white/10"]} />
              </div>
            </div>

            <SkeletonBlock className="h-3.5 w-56 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="reveal-fade-up reveal-delay-2 p-6 sm:p-8 lg:p-10">
          <div className="reveal-stagger mx-auto w-full max-w-md" aria-hidden="true">
            <SkeletonBlock className="h-3.5 w-32 rounded-full" />
            <SkeletonBlock className="mt-5 h-10 w-9/12 rounded-[1rem]" />
            <SkeletonLines className="mt-5" lines={["w-full", "w-11/12", "w-8/12"]} />

            <div className="mt-8 space-y-5">
              <div className="skeleton-surface rounded-[1.5rem] p-4">
                <SkeletonBlock className="h-14 rounded-2xl" />
              </div>
              <div className="skeleton-surface rounded-[1.5rem] p-4">
                <div className="mb-3 flex justify-end">
                  <SkeletonBlock className="h-3.5 w-28 rounded-full" />
                </div>
                <SkeletonBlock className="h-14 rounded-2xl" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-32 rounded-full" />
                <SkeletonBlock className="h-3.5 w-36 rounded-full" />
              </div>
              <SkeletonButton className="w-full" />
            </div>

            <p className="mt-6 text-sm text-slate-500">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSkeleton;
