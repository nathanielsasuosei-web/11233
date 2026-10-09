import Link from 'next/link';
import Hero from '@/components/Hero';
import SectionHeading from '@/components/SectionHeading';
import BeatGrid from '@/components/BeatGrid';
import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import { getSettings } from '@/lib/db';
import { listBeats, listVideos, siteStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const settings = getSettings();
  const featured = listBeats({ featured: true, limit: 8 });
  const fresh = listBeats({ limit: 8 });
  const videos = listVideos(3);
  const stats = siteStats();
  const heroBeat = featured[0] || fresh[0] || null;

  return (
    <>
      <Hero
        settings={settings}
        beat={heroBeat}
        showreelUrl={videos[0]?.video_url || ''}
        stats={stats}
      />

      {/* ---------------- featured ---------------- */}
      <section className="container-x py-20 sm:py-28">
        <SectionHeading
          eyebrow="Hand-picked"
          title="Featured"
          accent="instrumentals"
          sub="The ones artists keep coming back for. Every beat is mixed and mastered, ready for your vocals."
          action={
            <Link href="/beats" className="btn-ghost !px-6 !py-3 text-xs">
              View all beats →
            </Link>
          }
        />
        <BeatGrid beats={featured.length ? featured : fresh} />
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

      {/* ---------------- CTA ---------------- */}
      <section className="container-x py-20 sm:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] border border-brand-500/20 bg-gradient-to-br from-brand-950 via-ink-900 to-ink-900 px-6 py-14 text-center sm:px-14 sm:py-20">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-600/25 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-800/25 blur-[90px]" />
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-25" />
            <div className="relative">
              <div className="chip mx-auto border-brand-500/30 bg-brand-950/60 text-brand-200">
                Limited slots this month
              </div>
              <h2 className="display mx-auto mt-6 max-w-3xl text-[clamp(2rem,5.4vw,3.8rem)] text-white">
                Need something
                <span className="bg-gradient-to-r from-brand-300 to-brand-600 bg-clip-text text-transparent">
                  {' '}
                  custom-built?
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                Custom production, mixing and mastering for artists and brands. Tell me the
                reference track and I&apos;ll send back something that sounds like you.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href="/contact" className="btn-red !px-8 !py-4 text-sm">
                  Start a project
                </Link>
                <Link href="/beats" className="btn-ghost !px-8 !py-4 text-sm">
                  Browse beats
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
