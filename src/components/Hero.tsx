'use client';

import Link from 'next/link';
import { useState } from 'react';
import HeroCanvas from './HeroCanvas';
import HeroPlayer, { type HeroBeat } from './HeroPlayer';
import VideoModal from './VideoModal';

export default function Hero({
  settings,
  beat,
  showreelUrl,
  stats,
}: {
  settings: Record<string, string>;
  beat: HeroBeat | null;
  showreelUrl: string;
  stats: { beats: number; artists: number; sold: number };
}) {
  const [video, setVideo] = useState(false);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink-900">
      {/* ---------- background layers ---------- */}
      <div className="grid-bg mask-fade-b absolute inset-0 opacity-60" />
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-600/20 blur-[130px]" />
      <div className="absolute -right-32 top-24 h-[460px] w-[460px] rounded-full bg-brand-800/25 blur-[120px]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] animate-glow-sweep bg-[linear-gradient(120deg,transparent_20%,rgba(255,45,58,.10)_45%,transparent_70%)] bg-[length:200%_100%]" />
      <HeroCanvas className="absolute inset-x-0 bottom-0 h-[58%] w-full" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[.035] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_35%,rgba(8,8,10,.85)_100%)]" />

      {/* ---------- content ---------- */}
      <div className="container-x relative flex min-h-[100svh] flex-col justify-center pb-28 pt-28 sm:pb-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div
              className="animate-fade-up mb-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '60ms' }}
            >
              <Link href="/beats" className="btn-red !px-8 !py-4 text-sm">
                Browse {stats.beats} beats
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <button onClick={() => setVideo(true)} className="btn-ghost !px-7 !py-4 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                    <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
                  </svg>
                </span>
                Watch showreel
              </button>
            </div>

            <div
              className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-brand-500/30 bg-brand-950/50 px-4 py-2 text-[11px] font-bold uppercase tracking-[.18em] text-brand-200 backdrop-blur"
              style={{ animationDelay: '60ms' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              New drops every Friday · Instant delivery
            </div>

            <dl
              className="animate-fade-up mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/[.08] pt-7"
              style={{ animationDelay: '1120ms' }}
            >
              {[
                ['Beats online', String(stats.beats)],
                ['Artists served', `${stats.artists}+`],
                ['Licences sold', String(stats.sold)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                    {label}
                  </dt>
                  <dd className="display mt-1.5 text-[clamp(1.4rem,3vw,2.1rem)] text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {beat && (
            <div className="animate-fade-up lg:pl-6" style={{ animationDelay: '640ms' }}>
              <div className="animate-float">
                <HeroPlayer beat={beat} />
              </div>
            </div>
          )}
        </div>
      </div>

      <VideoModal
        open={video}
        onClose={() => setVideo(false)}
        url={showreelUrl}
        title="Studio showreel"
      />
    </section>
  );
}
