import Link from 'next/link';
import Hero from '@/components/Hero';
import SectionHeading from '@/components/SectionHeading';
import BeatGrid from '@/components/BeatGrid';
import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import { getSettings } from '@/lib/db';
import { listBeats, listVideos, siteStats } from '@/lib/queries';
import { playableBeats } from '@/lib/preview';

const STUDIO_SERVICES = [
  {
    number: '01',
    title: 'Recording',
    label: 'Capture the performance',
    icon: 'recording' as const,
    description:
      'Get a clear, confident vocal take with focused tracking, punch-ins, and take comping shaped around your performance.',
    details: ['Vocal tracking', 'Punch-ins', 'Take comping'],
  },
  {
    number: '02',
    title: 'Mixing',
    label: 'Bring every layer into focus',
    icon: 'mixing' as const,
    description:
      'Balance vocals and instruments, shape space and detail, and make every element work together as one record.',
    details: ['Vocal balance', 'Depth & clarity', 'Mix revisions'],
  },
  {
    number: '03',
    title: 'Mastering',
    label: 'Finish it for release',
    icon: 'mastering' as const,
    description:
      'Add the final tonal and loudness polish so your track feels cohesive and translates across listening systems.',
    details: ['Final polish', 'Streaming-ready', 'Release check'],
  },
];

function StudioServiceIcon({ name }: { name: 'recording' | 'mixing' | 'mastering' }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'recording' ? (
        <>
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1m7 8v4m-4 0h8" />
        </>
      ) : name === 'mixing' ? (
        <>
          <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3" />
          <path d="M2 14h4m4-6h4m4 4h4" />
        </>
      ) : (
        <path d="M2 12h3l2-6 4 12 3-9 2 6 2-3h4" />
      )}
    </svg>
  );
}

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const settings = getSettings();
  // No cap: every published beat is listed, so every preview is reachable here.
  // listBeats() sorts featured first, so the highlights still lead the grid.
  const beats = listBeats();
  const previews = playableBeats(beats);
  const videos = listVideos(3);
  const stats = siteStats();
  const heroBeat = beats.find((b) => b.featured) || beats[0] || null;

  return (
    <>
      <Hero
        settings={settings}
        beat={heroBeat}
        tracks={previews}
        showreelUrl={videos[0]?.video_url || ''}
        stats={stats}
      />

      {/* ---------------- every beat ---------------- */}
      <section className="container-x py-20 sm:py-28">
        <SectionHeading
          eyebrow="The full catalogue"
          title="Every"
          accent="instrumental"
          sub={`${beats.length} beat${beats.length === 1 ? '' : 's'} listed with a playable preview${
            previews.length !== beats.length ? ` (${previews.length} with audio uploaded so far)` : ''
          }. Hit play on any cover, then pick the licence that fits your release.`}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/previews" className="btn-red !px-6 !py-3 text-xs">
                Preview list →
              </Link>
              <Link href="/beats" className="btn-ghost !px-6 !py-3 text-xs">
                View all beats →
              </Link>
            </div>
          }
        />
        <BeatGrid beats={beats} />
      </section>

      {/* ---------------- videos ---------------- */}
      {videos.length > 0 && (
        <section className="relative overflow-hidden border-y border-white/[.06] bg-ink-850/50 py-20 sm:py-28">
          <div className="container-x relative">
            <SectionHeading
              eyebrow="Studio feed"
              title="Watch the"
              accent="process"
              sub="Beat breakdowns, studio sessions and live sets."
              action={
                <Link href="/videos" className="btn-ghost !px-6 !py-3 text-xs">
                  All videos →
                </Link>
              }
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <Reveal key={v.id} delay={i * 90}>
                  <VideoCard video={v} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- studio services ---------------- */}
      <section
        id="studio"
        className="relative isolate scroll-mt-24 overflow-hidden border-t border-white/[.06] bg-ink-850/25"
      >
        <div className="pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full bg-brand-700/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-brand-950/30 blur-[110px]" />
        <div className="container-x relative py-20 sm:py-28">
          <SectionHeading
            eyebrow="Studio services"
            title="From first take to"
            accent="final master"
            sub="Recording, mixing and mastering for artists who want their records to feel finished and release-ready."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {STUDIO_SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 90}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-white/[.08] bg-black/[.35] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/30 hover:bg-ink-850/80">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-600/10 blur-3xl transition-colors duration-500 group-hover:bg-brand-500/20" />
                  <div className="relative flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-brand-500/20 bg-brand-950/40 text-brand-300 transition-colors group-hover:border-brand-500/40 group-hover:bg-brand-950/70">
                      <StudioServiceIcon name={service.icon} />
                    </span>
                    <span className="display text-3xl text-white/15 transition-colors group-hover:text-brand-500/35">
                      {service.number}
                    </span>
                  </div>
                  <div className="relative mt-7 text-[10px] font-bold uppercase tracking-[.18em] text-brand-300">
                    {service.label}
                  </div>
                  <h3 className="display relative mt-2 text-2xl text-white">{service.title}</h3>
                  <p className="relative mt-3 min-h-[72px] text-sm leading-6 text-white/50">
                    {service.description}
                  </p>
                  <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/[.07] pt-5">
                    {service.details.map((detail) => (
                      <span key={detail} className="chip text-[9px]">
                        {detail}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/contact?service=${service.title.toLowerCase()}`}
                    aria-label={`Enquire about ${service.title}`}
                    className="btn-ghost relative mt-6 w-full !justify-between !rounded-xl !px-4 !py-3 text-xs"
                  >
                    Enquire about {service.title}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-7 flex flex-col gap-5 rounded-3xl border border-brand-500/20 bg-gradient-to-r from-brand-950/40 via-ink-900/80 to-ink-900/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-300">
                  Ready for the next step?
                </div>
                <h3 className="display mt-2 text-xl text-white">Tell us what your track needs.</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
                  Share a demo, a reference, or where you are in the process and we&apos;ll help you
                  choose the right studio service.
                </p>
              </div>
              <Link href="/contact" className="btn-red shrink-0 !px-6 !py-3 text-xs">
                Contact the studio
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
