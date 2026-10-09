import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BuyPanel from '@/components/BuyPanel';
import BeatCard from '@/components/BeatCard';
import Reveal from '@/components/Reveal';
import VideoModalTrigger from '@/components/VideoModalTrigger';
import BeatPreviewPlayer from '@/components/BeatPreviewPlayer';
import { getBeatBySlug, listBeats, relatedBeats } from '@/lib/queries';
import { previewLabel, previewSrc } from '@/lib/preview';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const beat = getBeatBySlug(params.slug);
  if (!beat) return { title: 'Beat not found — Project 1' };
  return {
    title: `${beat.title} — ${beat.genre} beat | Project 1`,
    description: beat.description.slice(0, 155),
  };
}

export default function BeatDetailPage({ params }: Props) {
  const beat = getBeatBySlug(params.slug);
  if (!beat) notFound();

  const related = relatedBeats(beat, 4);
  const more = related.length >= 3 ? related : listBeats({ limit: 4 }).filter((b) => b.id !== beat.id).slice(0, 4);
  const tags = (beat.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  const spec: [string, string][] = [
    ['Genre', beat.genre],
    ['BPM', String(beat.bpm)],
    ['Key', beat.musical_key || '—'],
    ['Mood', beat.mood || '—'],
    ['Licences sold', String(beat.sales)],
    ['Plays', String(beat.plays)],
  ];

  return (
    <div className="container-x py-12 sm:py-16">
      <Link
        href="/beats"
        className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-white/40 transition hover:text-brand-300"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to catalogue
      </Link>

      <div className="grid gap-9 lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* -------- left -------- */}
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-ink-850">
              <div className="relative aspect-square">
                {beat.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={beat.cover_url} alt={beat.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-ink-900">
                    <span className="display text-5xl text-white/20">{beat.title.slice(0, 2)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="chip border-brand-500/30 bg-brand-950/70 text-brand-300">
                    {beat.genre}
                  </span>
                  {beat.featured ? (
                    <span className="chip border-white/15 bg-black/60 text-white">Featured</span>
                  ) : null}
                </div>
              </div>
            </div>

            <BeatPreviewPlayer
              src={previewSrc(beat)}
              title={beat.title}
              beatId={beat.id}
              label={previewLabel(beat)}
            />

            {beat.video_url && (
              <div className="mt-4">
                <VideoModalTrigger
                  url={beat.video_url}
                  title={`${beat.title} — video`}
                  label="Watch the video for this beat"
                />
              </div>
            )}

            {/* spec grid */}
            <dl className="mt-5 grid grid-cols-3 gap-3">
              {spec.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/[.07] bg-ink-850/60 px-3 py-3 text-center">
                  <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">{k}</dt>
                  <dd className="mt-1 truncate text-[13px] font-bold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* -------- right -------- */}
        <Reveal delay={90}>
          <div>
            <h1 className="display text-[clamp(2rem,5.4vw,3.6rem)] text-white">{beat.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/40">
              <span className="text-brand-400">{beat.genre}</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{beat.bpm} BPM</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{beat.musical_key}</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{beat.mood}</span>
            </div>

            {beat.description && (
              <p className="mt-6 text-sm leading-relaxed text-white/55">{beat.description}</p>
            )}

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link key={t} href={`/beats?q=${encodeURIComponent(t)}`} className="chip hover:border-brand-500/40 hover:text-white">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8">
              <BuyPanel beat={beat} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.07] bg-ink-850/50 p-4">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="text-[13px] font-bold text-white">Instant delivery</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-white/40">
                    Download link emailed to you the second payment clears.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.07] bg-ink-850/50 p-4">
                <span className="text-lg">🔒</span>
                <div>
                  <div className="text-[13px] font-bold text-white">Secure checkout</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-white/40">
                    Mobile Money, bank transfer and card via Paystack.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* -------- related -------- */}
      {more.length > 0 && (
        <section className="mt-20 border-t border-white/[.06] pt-12">
          <h2 className="display mb-7 text-2xl text-white">
            YOU MIGHT ALSO <span className="text-brand-500">LIKE</span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((b) => (
              <BeatCard key={b.id} beat={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
