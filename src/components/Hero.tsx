'use client';

import Link from 'next/link';
import HeroPlayer, { type HeroBeat } from './HeroPlayer';

export default function Hero({
  settings,
  beat,
  tracks = [],
  stats,
}: {
  settings: Record<string, string>;
  beat: HeroBeat | null;
  /** Every beat preview, listed as a queue under the player. */
  tracks?: HeroBeat[];
  stats: { beats: number };
}) {
  const playerBeat = beat || tracks[0] || null;
  const producer = settings.producer_name || 'Independent producer';
  const studio = settings.studio_name || 'Project 1';
  const tagline = (settings.tagline || 'Original beats and studio work').replace(/[.!?]+$/, '');
  const address = settings.studio_address?.split('—')[0]?.trim();

  return (
    <section className="relative overflow-hidden border-b border-white/[.10] bg-ink-900">
      <div className="container-x relative">
        <div className="grid items-center gap-12 py-14 sm:py-20 lg:min-h-[660px] lg:grid-cols-[1.03fr_.97fr] lg:gap-14 lg:py-16 xl:gap-20">
          <div className="max-w-2xl">
            <div className="hero-enter mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.17em] text-white/55" style={{ animationDelay: '40ms' }}>
              <span className="h-px w-8 bg-brand-400" />
              {studio}
              <span className="text-white/25">/</span>
              {address || 'Independent production'}
            </div>

            <h1 className="hero-enter display max-w-[12ch] text-[clamp(3.1rem,7.2vw,6.4rem)] leading-[.94] text-white" style={{ animationDelay: '120ms' }}>
              Find a beat.
              <br />
              <span className="font-normal italic text-brand-300">Make it yours.</span>
            </h1>

            <p className="hero-enter mt-7 max-w-xl text-[15px] leading-7 text-white/65 sm:text-base" style={{ animationDelay: '200ms' }}>
              {tagline}. Listen through the catalogue,
              choose the licence that suits your release, and the files are sent after payment clears.
            </p>

            <div className="hero-enter mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '280ms' }}>
              <Link href="/beats" className="btn-red !px-6 !py-3.5 text-[13px]">
                Browse {stats.beats > 0 ? `${stats.beats} beats` : 'the beats'}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/previews" className="btn-ghost !px-5 !py-3.5 text-[13px]">
                Listen before you buy
              </Link>
            </div>

            <div className="hero-enter mt-12 flex items-center gap-3 border-t border-white/[.12] pt-5" style={{ animationDelay: '360ms' }}>
              <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 font-serif text-sm text-brand-200">
                {producer
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('')}
              </span>
              <div className="text-[12px] leading-5">
                <div className="text-white/85">Produced by {producer}</div>
                <div className="text-white/40">Beats, recording, mixing &amp; mastering</div>
              </div>
            </div>
          </div>

          {playerBeat && tracks.length > 0 ? (
            <div className="hero-enter relative lg:ml-auto lg:w-full lg:max-w-[510px]" style={{ animationDelay: '220ms' }}>
              <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-[.13em] text-white/45">
                <span>Take a listen</span>
                <span className="text-brand-300">{tracks.length} playable preview{tracks.length === 1 ? '' : 's'}</span>
              </div>
              <HeroPlayer beat={playerBeat} tracks={tracks} />
            </div>
          ) : (
            <div className="border-y border-white/[.12] py-10 lg:ml-auto lg:w-full lg:max-w-[510px]">
              <p className="display text-2xl text-white">The first beat is on its way.</p>
              <p className="mt-2 text-sm text-white/50">Check back soon, or get in touch about a custom track.</p>
              <Link href="/contact" className="btn-ghost mt-5 !px-4 !py-2.5 text-xs">Contact the studio</Link>
            </div>
          )}
        </div>

        <div className="hero-enter grid gap-5 border-t border-white/[.10] py-5 text-[12px] text-white/55 sm:grid-cols-3 sm:gap-8" style={{ animationDelay: '420ms' }}>
          <div className="flex gap-3"><span className="font-serif text-brand-300">01</span><span><strong className="font-medium text-white/85">Hear it first.</strong> Preview the catalogue before you choose.</span></div>
          <div className="flex gap-3"><span className="font-serif text-brand-300">02</span><span><strong className="font-medium text-white/85">Pick your rights.</strong> Licence details are shown up front.</span></div>
          <div className="flex gap-3"><span className="font-serif text-brand-300">03</span><span><strong className="font-medium text-white/85">Get straight to work.</strong> Files are delivered by email.</span></div>
        </div>
      </div>
    </section>
  );
}
