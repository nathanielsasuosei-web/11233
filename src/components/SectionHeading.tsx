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
          <div className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
            <span className="h-px w-7 bg-brand-500" />
            {eyebrow}
          </div>
        )}
        <h2 className="display text-[clamp(1.9rem,4.4vw,3.2rem)] text-white">
          {title}{' '}
          {accent && <span className="font-normal italic text-brand-300">{accent}</span>}
        </h2>
        {sub && <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
