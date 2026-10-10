import BeatCard, { type BeatLayout, type BeatLite } from './BeatCard';
import Reveal from './Reveal';

export default function BeatGrid({
  beats,
  layout = 'grid',
}: {
  beats: BeatLite[];
  layout?: BeatLayout;
}) {
  if (!beats.length) {
    return (
      <div className="card grid place-items-center px-6 py-20 text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-brand-300">No matches</p>
        <h3 className="display text-xl text-white">Nothing in this filter.</h3>
        <p className="mt-2 max-w-sm text-sm text-white/55">
          Try another search term or clear the filters to see the full catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className={layout === 'list' ? 'grid gap-3' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
      {beats.map((beat, index) => (
        <Reveal key={beat.id} delay={Math.min(index * 55, 380)}>
          <BeatCard beat={beat} layout={layout} />
        </Reveal>
      ))}
    </div>
  );
}
