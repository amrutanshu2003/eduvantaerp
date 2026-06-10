import { FiMoon } from "react-icons/fi";
import { SkeletonBlock, SkeletonButton } from "./Skeleton";

const SecureRecoverySkeleton = ({ message = "Loading secure recovery..." }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 36%), radial-gradient(circle at bottom right, rgba(245,158,11,0.14), transparent 28%)",
        }}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-card">
        <div className="relative overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#0f766e_100%)] px-6 py-7 text-white sm:px-8">
          <div className="absolute inset-0 opacity-90" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <SkeletonBlock className="h-3 w-36 rounded-full bg-white/20" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-200">
              <FiMoon className="h-5 w-5" />
            </div>
          </div>

          <div className="relative z-10 mt-5 space-y-4">
            <SkeletonBlock className="h-10 w-9/12 rounded-[1rem] bg-white/15 sm:h-12" />
            <SkeletonBlock className="h-4 w-full rounded-full bg-white/10" />
            <SkeletonBlock className="h-4 w-10/12 rounded-full bg-white/10" />
            <SkeletonBlock className="h-4 w-9/12 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="space-y-5 px-6 py-7 sm:px-8 sm:py-8" aria-hidden="true">
          <div className="skeleton-surface rounded-[1.5rem] p-4">
            <SkeletonBlock className="h-4 w-36 rounded-full" />
            <SkeletonBlock className="mt-3 h-3.5 w-11/12 rounded-full" />
          </div>

          <div className="skeleton-surface rounded-[1.5rem] p-4">
            <SkeletonBlock className="h-3.5 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="skeleton-surface rounded-[1.5rem] p-4">
              <SkeletonBlock className="h-3.5 w-32 rounded-full" />
              <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
            </div>
            <div className="skeleton-surface rounded-[1.5rem] p-4">
              <SkeletonBlock className="h-3.5 w-40 rounded-full" />
              <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
            </div>
          </div>

          <div className="skeleton-surface rounded-[1.5rem] p-4">
            <SkeletonBlock className="h-3.5 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="skeleton-surface rounded-[1.5rem] p-4">
              <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
            </div>
            <div className="skeleton-surface rounded-[1.5rem] p-4">
              <SkeletonBlock className="h-3.5 w-32 rounded-full" />
              <SkeletonBlock className="mt-3 h-12 rounded-2xl" />
            </div>
          </div>

          <SkeletonButton className="w-full" />
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default SecureRecoverySkeleton;
