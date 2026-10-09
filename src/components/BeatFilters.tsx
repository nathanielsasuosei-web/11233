'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'price-desc', label: 'Price ↓' },
  { id: 'bpm', label: 'BPM' },
  { id: 'title', label: 'A–Z' },
];

export default function BeatFilters({
  genres,
  active,
  basePath = '/beats',
}: {
  genres: { genre: string; count: number }[];
  active: { genre: string; q: string; sort: string };
  /** Page the filters write to — the preview list reuses this on /previews. */
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(active.q);
  const [pending, startTransition] = useTransition();

  useEffect(() => setQ(active.q), [active.q]);

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v || (k === 'genre' && v === 'All')) sp.delete(k);
      else sp.set(k, v);
    });
    startTransition(() => router.push(`${basePath}?${sp.toString()}`, { scroll: false }));
  }

  return (
    <div className="mb-9 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q });
          }}
          className="relative flex-1"
        >
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, genre, mood or key…"
            className="input !pl-11 !pr-24"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
          >
            Search
          </button>
        </form>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => update({ sort: s.id })}
              className={`whitespace-nowrap rounded-full border px-4 py-3 text-xs font-semibold transition ${
                (active.sort || 'new') === s.id
                  ? 'border-brand-500/50 bg-brand-500/15 text-brand-200'
                  : 'border-white/10 bg-white/[.03] text-white/50 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {['All', ...genres.map((g) => g.genre)].map((g) => {
          const count = g === 'All' ? genres.reduce((s, x) => s + x.count, 0) : genres.find((x) => x.genre === g)?.count;
          const isActive = (active.genre || 'All') === g;
          return (
            <button
              key={g}
              onClick={() => update({ genre: g })}
              className={`group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
                isActive
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-white/10 bg-white/[.03] text-white/50 hover:border-white/25 hover:text-white'
              } ${pending ? 'opacity-60' : ''}`}
            >
              {g}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? 'bg-black/25 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
