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
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.03] text-2xl">
          🔍
        </div>
        <h3 className="display text-xl text-white">No beats found</h3>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          Try a different genre, clear the search, or check back soon — new packs drop every Friday.
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
