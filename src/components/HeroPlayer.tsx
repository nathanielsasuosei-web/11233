'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CoverArt } from './BeatCard';
import { useCart } from './CartProvider';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type HeroBeat = {
  id: number;
  slug: string;
  title: string;
  genre: string;
  bpm: number;
  musical_key: string;
  cover_url?: string;
  preview_url?: string;
  price_basic: number;
  price_premium: number;
  price_exclusive: number;
  price_buyout: number;
};

export default function HeroPlayer({ beat }: { beat: HeroBeat }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const cart = useCart();
  const money = useMoney();
  const toast = useToast();

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress((a.currentTime / (a.duration || 30)) * 100);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(
        () => setPlaying(true),
        () => toast('Preview unavailable', 'err'),
      );
    }
  }

  return (
    <div className="relative">
      {/* spinning vinyl behind the artwork */}
      <div
        className={`pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full opacity-70 ${
          playing ? 'spin-slow' : ''
        }`}
        style={{
          background:
            'repeating-radial-gradient(circle at 50% 50%, #141418 0 2px, #0b0b0e 2px 4px)',
          boxShadow: '0 30px 80px -30px rgba(255,45,58,.6)',
        }}
      />
      <div className="pointer-events-none absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-brand-600/25 blur-2xl" />

      <div className="relative animate-fade-up rounded-[26px] border border-white/10 bg-ink-850/80 p-5 backdrop-blur-xl red-glow">
        <div className="flex items-center justify-between">
          <span className="chip border-brand-500/30 bg-brand-950/60 text-brand-300">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-brand-400 ${playing ? 'animate-pulse' : ''}`}
            />
            Now previewing
          </span>
          <div className="flex items-end gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="eq-bar w-[3px] rounded-full bg-brand-400"
                style={{
                  height: playing ? 18 : 5,
                  animationDelay: `${i * 120}ms`,
                  animationPlayState: playing ? 'running' : 'paused',
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
            <CoverArt beat={beat as any} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/beats/${beat.slug}`}
              className="block truncate text-lg font-black text-white hover:text-brand-300"
            >
              {beat.title}
            </Link>
            <div className="mt-1 text-[11px] uppercase tracking-[.16em] text-white/40">
              {beat.genre} · {beat.bpm} BPM · {beat.musical_key}
            </div>
            <div className="display mt-2 text-2xl text-white">{money(beat.price_basic)}</div>
          </div>
        </div>

        <audio ref={audioRef} src={beat.preview_url || ''} preload="none" />

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={toggle}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-[0_10px_30px_-8px_rgba(255,45,58,.9)] transition hover:scale-105"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-200"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-white/35">
              <span>{playing ? 'Playing preview' : 'Paused'}</span>
              <span>Tagged MP3 preview</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              cart.add({
                beatId: beat.id,
                slug: beat.slug,
                title: beat.title,
                cover: beat.cover_url || '',
                license: 'basic',
                licenseName: 'Basic Lease (MP3)',
                price: Number(beat.price_basic),
              });
              toast(`${beat.title} added to cart`);
            }}
            className="btn-red text-xs"
          >
            Add to cart
          </button>
          <Link href={`/beats/${beat.slug}`} className="btn-ghost text-xs">
            View licences
          </Link>
        </div>
      </div>
    </div>
  );
}
