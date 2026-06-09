const EmptyState = ({ title, description }) => {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </div>
  );
};

export default EmptyState;
