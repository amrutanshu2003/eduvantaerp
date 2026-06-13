import { SkeletonBlock, SkeletonButton, SkeletonLines } from "./Skeleton";

const LoginSkeleton = ({ message = "Loading login experience..." }) => {
  return (
    <div className="relative flex min-h-screen justify-center overflow-y-auto overflow-x-hidden bg-slate-950 px-4 py-6 md:items-start md:py-8 lg:pt-8 lg:pb-6">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 28%)",
        }}
      />

      <div className="relative mx-auto mt-2 w-[calc(100%-32px)] max-w-[1360px] overflow-hidden rounded-[2rem] bg-white shadow-card lg:mt-6 lg:grid lg:grid-cols-2 lg:min-h-[600px] xl:max-h-[calc(100vh-96px)]">
        <div className="reveal-fade-up relative hidden overflow-hidden px-10 py-10 text-white lg:flex xl:px-12 xl:py-12">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0f172a_0%,#0f766e_100%)]" />
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between gap-4" aria-hidden="true">
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

            <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="reveal-fade-up reveal-delay-2 p-6 sm:p-8 lg:flex lg:border-l lg:border-t-0 lg:p-10 xl:p-12">
          <div className="reveal-stagger mx-auto flex w-full max-w-[520px] flex-col justify-center" aria-hidden="true">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <SkeletonBlock className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-36 rounded-full" />
                <SkeletonBlock className="h-3 w-32 rounded-full" />
              </div>
            </div>
            <SkeletonBlock className="h-3.5 w-32 rounded-full" />
            <SkeletonBlock className="mt-5 h-12 w-9/12 rounded-[1rem]" />
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


          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSkeleton;
