const PageHeader = ({ eyebrow, title, description, actions = null }) => {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
};

export default PageHeader;
