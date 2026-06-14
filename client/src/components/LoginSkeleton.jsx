import { SkeletonBlock, SkeletonButton, SkeletonLines } from "./Skeleton";

const LoginSkeleton = ({ message = "Loading login experience..." }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-50 px-4 py-6 transition-colors duration-500 ease-in-out dark:bg-slate-950">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div className="relative z-10 w-full md:hidden">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_left,rgba(18,149,149,0.24),transparent_34%),linear-gradient(180deg,#091428_0%,#0b1526_100%)] p-3 shadow-card">
          <div className="rounded-[1.75rem] border border-white/5 bg-slate-900/80 px-5 py-5 shadow-[0_18px_50px_rgba(2,6,23,0.32)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3" aria-hidden="true">
              <SkeletonBlock className="h-9 w-9 rounded-2xl bg-white/10" />
              <div className="min-w-0 space-y-2">
                <SkeletonBlock className="h-2.5 w-24 rounded-full bg-white/10" />
                <SkeletonBlock className="h-3 w-40 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="flex items-start justify-between gap-4" aria-hidden="true">
              <SkeletonBlock className="mt-1 h-3 w-28 rounded-full bg-white/10" />
              <SkeletonBlock className="h-12 w-12 rounded-full bg-white/10" />
            </div>

            <SkeletonBlock className="mt-5 h-16 w-11/12 rounded-[1.15rem] bg-white/10" />
            <SkeletonLines className="mt-3" lines={["w-full bg-white/10", "w-11/12 bg-white/10", "w-8/12 bg-white/10"]} />

            <div className="mt-6 space-y-4" aria-hidden="true">
              <div>
                <div className="rounded-2xl border border-white/8 p-2.5">
                  <SkeletonBlock className="h-[2.75rem] rounded-xl bg-white/10" />
                </div>
                <SkeletonBlock className="mt-2 h-3 w-48 rounded-full bg-white/10" />
              </div>

              <div className="rounded-2xl border border-white/8 p-2.5">
                <SkeletonBlock className="h-[2.75rem] rounded-xl bg-white/10" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-4 w-4 rounded-md bg-white/10" />
                  <SkeletonBlock className="h-3.5 w-28 rounded-full bg-white/10" />
                </div>
                <SkeletonBlock className="h-3 w-36 rounded-full bg-white/10" />
              </div>

              <SkeletonButton className="h-[3rem] w-full rounded-2xl bg-white/10" />
            </div>

            <p className="sr-only">{message}</p>
          </div>
        </div>
      </div>

      <div className="login-theme-surface relative mx-auto hidden w-full max-w-[1320px] overflow-hidden rounded-3xl bg-white shadow-card transition-colors duration-500 ease-in-out dark:bg-slate-900 md:block lg:grid lg:min-h-[560px] lg:grid-cols-2">
        <div className="login-theme-surface relative hidden overflow-hidden px-8 py-8 text-white transition-colors duration-500 ease-in-out lg:flex lg:px-10 lg:py-10 xl:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0f172a_0%,#0f766e_100%)]" />
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-center gap-6" aria-hidden="true">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-2xl bg-white/15" />
                <div className="space-y-2.5">
                  <SkeletonBlock className="h-3 w-32 rounded-full bg-white/20" />
                  <SkeletonBlock className="h-3 w-40 rounded-full bg-white/10" />
                </div>
              </div>

              <SkeletonBlock className="h-14 w-full max-w-[22rem] rounded-[1rem] bg-white/15" />
              <SkeletonLines
                className="max-w-[25rem]"
                lines={["w-full bg-white/10", "w-11/12 bg-white/10", "w-8/12 bg-white/10"]}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-3.5 backdrop-blur">
                <SkeletonBlock className="h-4 w-28 rounded-full bg-white/15" />
                <SkeletonLines className="mt-3" lines={["w-full bg-white/10", "w-10/12 bg-white/10"]} />
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-3.5 backdrop-blur">
                <SkeletonBlock className="h-4 w-28 rounded-full bg-white/15" />
                <SkeletonLines className="mt-3" lines={["w-full bg-white/10", "w-10/12 bg-white/10"]} />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <SkeletonBlock className="h-3.5 w-52 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <div className="login-theme-surface border-slate-200/70 p-6 transition-colors duration-500 ease-in-out sm:p-8 lg:flex lg:items-center lg:border-l lg:border-t-0 lg:px-10 lg:py-8 xl:px-12 xl:py-10 dark:border-slate-700/60">
          <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center" aria-hidden="true">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <SkeletonBlock className="h-11 w-11 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-28 rounded-full" />
                <SkeletonBlock className="h-3 w-36 rounded-full" />
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              <SkeletonBlock className="h-12 w-12 rounded-full" />
            </div>

            <SkeletonBlock className="mt-3 h-12 w-10/12 rounded-[1rem]" />
            <SkeletonLines className="mt-2.5" lines={["w-full", "w-11/12", "w-9/12"]} />

            <div className="mt-6 space-y-4">
              <div>
                <div className="rounded-2xl border border-slate-200/70 p-3.5 dark:border-slate-700/60">
                  <SkeletonBlock className="h-[3.25rem] rounded-2xl" />
                </div>
                <SkeletonBlock className="mt-2 h-3 w-56 rounded-full" />
              </div>

              <div className="rounded-2xl border border-slate-200/70 p-3.5 dark:border-slate-700/60">
                <SkeletonBlock className="h-[3.25rem] rounded-2xl" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SkeletonBlock className="h-4 w-28 rounded-full" />
                <SkeletonBlock className="h-3.5 w-36 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <SkeletonBlock className="h-11 min-w-[118px] rounded-xl" />
                    <SkeletonBlock className="h-11 w-11 rounded-xl" />
                  </div>
                  <SkeletonBlock className="h-11 flex-1 rounded-xl" />
                </div>
              </div>

              <SkeletonButton className="h-[3.25rem] w-full rounded-2xl sm:h-[3.375rem]" />
            </div>

            <p className="sr-only">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSkeleton;
