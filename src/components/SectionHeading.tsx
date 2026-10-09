import Reveal from './Reveal';

export default function SectionHeading({
  eyebrow,
  title,
  accent,
  sub,
  action,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  sub?: string;
  action?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <Reveal
      className={`mb-10 flex flex-col gap-5 sm:flex-row sm:items-end ${
        center ? 'sm:flex-col sm:items-center sm:text-center' : 'sm:justify-between'
      }`}
    >
      <div className={center ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
            <span className="h-[2px] w-7 bg-brand-500" />
            {eyebrow}
          </div>
        )}
        <h2 className="display text-[clamp(1.9rem,4.4vw,3.2rem)] text-white">
          {title}{' '}
          {accent && (
            <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">
              {accent}
            </span>
          )}
        </h2>
        {sub && <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/45">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
