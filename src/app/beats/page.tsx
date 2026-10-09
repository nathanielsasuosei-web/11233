import type { Metadata } from 'next';
import Link from 'next/link';
import BeatFilters from '@/components/BeatFilters';
import BeatGrid from '@/components/BeatGrid';
import Reveal from '@/components/Reveal';
import { genres, listBeats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All beats — Project 1',
  description: 'Browse and preview every instrumental in the catalogue.',
};

export default function BeatsPage({
  searchParams,
}: {
  searchParams: { genre?: string; q?: string; sort?: string };
}) {
  const beats = listBeats({
    genre: searchParams.genre,
    q: searchParams.q,
    sort: searchParams.sort,
  });

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              The catalogue
            </div>
            <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
              ALL <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">BEATS</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/45">
              {beats.length} instrumental{beats.length === 1 ? '' : 's'} available. Hit play on any
              cover to preview it, then pick the licence that fits your release.
            </p>
          </div>
          <Link href="/previews" className="btn-ghost shrink-0 !px-6 !py-3 text-xs">
            Preview list →
          </Link>
        </div>
      </Reveal>

      <BeatFilters
        genres={genres()}
        active={{
          genre: searchParams.genre || 'All',
          q: searchParams.q || '',
          sort: searchParams.sort || 'new',
        }}
      />

      <BeatGrid beats={beats} layout="list" />
    </div>
  );
}
