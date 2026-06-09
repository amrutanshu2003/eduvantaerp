import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--theme-app-bg)", color: "var(--theme-text)" }}>
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white/80 p-8 text-center shadow-card backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-100">Access blocked</p>
        <h1 className="mt-4 text-4xl font-semibold">Unauthorized</h1>
        <p className="mt-4 text-slate-500">
          Your role does not have access to this page. Please return to your assigned dashboard.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-full bg-brand-600 px-5 py-3 font-medium text-white transition hover:bg-brand-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
