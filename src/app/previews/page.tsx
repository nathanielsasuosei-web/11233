import type { Metadata } from 'next';
import Link from 'next/link';
import BeatFilters from '@/components/BeatFilters';
import BeatPreviewList from '@/components/BeatPreviewList';
import Reveal from '@/components/Reveal';
import { genres, listBeats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Beat previews — Beatvault',
  description:
    'Every instrumental preview in the catalogue, listed in one place. Play them one by one or audition the whole list.',
};

export default function PreviewsPage({
  searchParams,
}: {
  searchParams: { genre?: string; q?: string; sort?: string };
}) {
  const beats = listBeats({
    genre: searchParams.genre,
    q: searchParams.q,
    sort: searchParams.sort,
  });
  const listed = beats.filter((b) => Boolean(b.preview_url || b.audio_url)).length;

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              Audition reel
            </div>
            <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
              ALL <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">PREVIEWS</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/45">
              {listed} of {beats.length} beat{beats.length === 1 ? '' : 's'} previewable — every one
              listed here, taggable preview first and the master when a producer has not cut a clip
              yet. Play a row, or run the whole list from the top.
            </p>
          </div>
          <Link href="/beats" className="btn-ghost shrink-0 !px-6 !py-3 text-xs">
            Browse as cards →
          </Link>
        </div>
      </Reveal>

      <BeatFilters
        basePath="/previews"
        genres={genres()}
        active={{
          genre: searchParams.genre || 'All',
          q: searchParams.q || '',
          sort: searchParams.sort || 'new',
        }}
      />

      <BeatPreviewList beats={beats} />
    </div>
  );
}
