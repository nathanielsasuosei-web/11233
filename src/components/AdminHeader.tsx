export default function AdminHeader({
  eyebrow,
  title,
  accent,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
        <span className="h-[2px] w-7 bg-brand-500" />
        {eyebrow}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
            {title}{' '}
            {accent && (
              <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">
                {accent}
              </span>
            )}
          </h1>
          {sub && <p className="mt-3 max-w-2xl text-sm text-white/45">{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
