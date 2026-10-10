'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { claimAudio, onAudioChange, releaseAudio } from '@/lib/audioBus';
import { isTaggedPreview, previewLabel, previewSrc } from '@/lib/preview';
import { LICENSES, priceFor } from '@/lib/utils';
import { useCart } from './CartProvider';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type BeatLayout = 'grid' | 'list';

export type BeatLite = {
  id: number;
  slug: string;
  title: string;
  genre: string;
  mood?: string;
  bpm: number;
  musical_key: string;
  cover_url?: string;
  preview_url?: string;
  audio_url?: string;
  price_basic: number;
  price_premium: number;
  price_exclusive: number;
  price_buyout: number;
  tags?: string;
  plays?: number;
  status?: string;
};

function fmtTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function CoverArt({ beat, className = '' }: { beat: BeatLite; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !beat.cover_url) {
    // A quiet sleeve-like fallback, rather than a synthetic gradient poster.
    const accents = ['#b96042', '#84917c', '#c09b5c', '#9a766c'];
    const accent = accents[Math.abs(beat.id) % accents.length];
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-[#1c1b17] ${className}`}>
        <div
          className="absolute right-[-11%] top-[5%] aspect-square w-[82%] rounded-full border border-white/[.09]"
          style={{
            background: 'repeating-radial-gradient(circle at center, #24231e 0 2px, #1c1b17 3px 5px)',
          }}
        >
          <span
            className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: accent }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/[.12] bg-[#171612]/95 px-4 py-4 text-left">
          <div className="text-[9px] font-medium uppercase tracking-[.16em] text-white/45">{beat.genre}</div>
          <div className="display mt-1 text-[clamp(1.2rem,3vw,2rem)] leading-none text-white">{beat.title}</div>
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={beat.cover_url}
      alt={beat.title}
      loading="lazy"
      onError={() => setBroken(true)}
      className={className}
    />
  );
}

export default function BeatCard({
  beat,
  layout = 'grid',
}: {
  beat: BeatLite;
  layout?: BeatLayout;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menu, setMenu] = useState(false);
  const cart = useCart();
  const money = useMoney();
  const toast = useToast();

  // Tagged clip when there is one, master otherwise — never "unplayable" for no reason.
  const src = previewSrc(beat);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => {
      setPlaying(false);
      setTime(0);
    };
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    a.addEventListener('ended', onEnd);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      releaseAudio(a);
    };
  }, []);

  // Another preview grabbed the speakers, so this one is silent — update the UI.
  useEffect(
    () =>
      onAudioChange((el) => {
        if (el !== audioRef.current) {
          setPlaying(false);
          setTime(0);
        }
      }),
    [],
  );

  function toggle() {
    const a = audioRef.current;
    if (!a || !src) {
      toast('No preview uploaded for this beat yet', 'err');
      return;
    }
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      claimAudio(a);
      a.play().then(
        () => setPlaying(true),
        () => toast('Preview could not be played', 'err'),
      );
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setTime(a.currentTime);
  }

  function addToCart(license: keyof typeof LICENSES) {
    const price = priceFor(beat as any, license);
    cart.add({
      beatId: beat.id,
      slug: beat.slug,
      title: beat.title,
      cover: beat.cover_url || '',
      license,
      licenseName: LICENSES[license].name,
      price: Number(price),
    });
    toast(`${beat.title} — ${LICENSES[license].name} added to cart`);
    setMenu(false);
  }

  const from = Math.min(
    beat.price_basic || Infinity,
    beat.price_premium || Infinity,
    beat.price_exclusive || Infinity,
  );

  return (
    <div
      className={`group relative rounded-sm border border-white/[.11] bg-ink-850 transition-colors duration-200 hover:border-brand-400/55 ${
        layout === 'list' ? 'flex items-center overflow-visible' : 'overflow-hidden'
      }`}
    >
      {src && <audio ref={audioRef} src={src} preload="none" />}

      <div
        className={`relative aspect-square overflow-hidden bg-ink-900 ${
          layout === 'list' ? 'w-28 shrink-0 sm:w-36 lg:w-40' : ''
        }`}
      >
        <CoverArt
          beat={beat}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/25 to-transparent" />

        {/* badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="chip border-brand-500/30 bg-brand-950/70 text-brand-300">
            {beat.genre}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <span className="chip border-white/10 bg-black/60 text-white">
            {beat.bpm} BPM
          </span>
        </div>

        {/* play */}
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white transition-colors duration-200 ${
            layout === 'list' ? 'h-11 w-11' : 'h-14 w-14'
          } ${
            playing
              ? 'bg-brand-600'
              : 'bg-black/60 opacity-90 group-hover:bg-brand-600 group-hover:opacity-100'
          }`}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
            </svg>
          )}
        </button>

        {/* scrubber */}
        <div className="absolute inset-x-3 bottom-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums text-white/55">
            <span>{fmtTime(time)}</span>
            <span className="truncate">{playing ? fmtTime(duration) : beat.musical_key || ''}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.1}
            value={time}
            onChange={seek}
            className="red-range w-full cursor-pointer opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ opacity: playing ? 1 : undefined }}
            aria-label="Seek preview"
          />
          {!isTaggedPreview(beat) && (
            <div className="mt-1 truncate text-center text-[8px] font-bold uppercase tracking-[.16em] text-white/35">
              {src ? previewLabel(beat) : 'no preview uploaded'}
            </div>
          )}
        </div>
      </div>

      <div
        className={`min-w-0 ${
          layout === 'list'
            ? 'flex flex-1 flex-col justify-between self-stretch p-3 sm:p-4'
            : 'p-4'
        }`}
      >
        <Link href={`/beats/${beat.slug}`} className="block">
          <h3 className="truncate text-[15px] font-bold text-white transition group-hover:text-brand-300">
            {beat.title}
          </h3>
        </Link>
        <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[.14em] text-white/35">
          <span>{beat.musical_key || '—'}</span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>{beat.mood || beat.genre}</span>
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[.16em] text-white/35">From</div>
            <div className="display text-xl text-white">{money(isFinite(from) ? from : 0)}</div>
          </div>

          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="btn-red !px-5 !py-2.5 text-xs">
              Buy
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div className="absolute bottom-[calc(100%+10px)] right-0 z-40 w-[268px] animate-fade-up overflow-hidden rounded-sm border border-white/15 bg-ink-800 p-1.5 shadow-xl">
                  <div className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
                    Choose a licence
                  </div>
                  {(Object.keys(LICENSES) as (keyof typeof LICENSES)[]).map((k) => {
                    const p = Number(priceFor(beat as any, k));
                    if (!p) return null;
                    return (
                      <button
                        key={k}
                        onClick={() => addToCart(k)}
                        className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors hover:bg-white/[.06]"
                      >
                        <span>
                          <span className="block text-[13px] font-semibold text-white">
                            {LICENSES[k].name}
                          </span>
                          <span className="block text-[10px] text-white/40">
                            {LICENSES[k].blurb.slice(0, 34)}…
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] font-bold text-brand-300">
                          {money(p)}
                        </span>
                      </button>
                    );
                  })}
                  <Link
                    href={`/beats/${beat.slug}`}
                    onClick={() => setMenu(false)}
                    className="mt-1 block rounded-sm px-2.5 py-2.5 text-[12px] font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
                  >
                    View full details →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
