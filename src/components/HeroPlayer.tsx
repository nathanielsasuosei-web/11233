'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { claimAudio, onAudioChange, releaseAudio } from '@/lib/audioBus';
import { isTaggedPreview, previewLabel, previewSrc } from '@/lib/preview';
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
  audio_url?: string;
  price_basic: number;
  price_premium: number;
  price_exclusive: number;
  price_buyout: number;
};

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/**
 * The hero player. The first beat is the "now previewing" record and every
 * other beat preview is listed underneath as a queue the visitor can click
 * through — one audio element, so only one preview can ever be live.
 */
export default function HeroPlayer({
  beat,
  tracks = [],
}: {
  beat: HeroBeat;
  tracks?: HeroBeat[];
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playRef = useRef<(t: HeroBeat) => void>(() => {});
  const queueRef = useRef(false);
  const [activeId, setActiveId] = useState<number>(beat.id);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);
  const cart = useCart();
  const money = useMoney();
  const toast = useToast();

  const list = useMemo(() => (tracks.length ? tracks : [beat]), [tracks, beat]);
  const active = list.find((b) => b.id === activeId) || list[0];
  const activeIndex = Math.max(
    0,
    list.findIndex((b) => b.id === active.id),
  );
  const src = previewSrc(active);

  const listRef = useRef(list);
  listRef.current = list;
  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;

  function stop() {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setPlaying(false);
    setProgress(0);
  }

  function play(t: HeroBeat) {
    const a = audioRef.current;
    if (!a) return;
    const next = previewSrc(t);
    if (!next) {
      toast('No preview uploaded for this beat yet', 'err');
      return;
    }
    const target = new URL(next, window.location.href).href;
    if (a.src !== target) {
      a.src = next;
      a.load();
      setDur(0);
      setProgress(0);
    }
    setActiveId(t.id);
    claimAudio(a);
    a.play().then(
      () => setPlaying(true),
      () => toast('Preview unavailable', 'err'),
    );
  }

  useEffect(() => {
    playRef.current = play;
  });

  function step(offset: number) {
    const next = listRef.current[indexRef.current + offset];
    if (next) play(next);
  }

  /** Plays the queue from the top; single tracks do not auto-advance. */
  function playAll() {
    queueRef.current = true;
    play(listRef.current[0]);
  }

  function toggleQueue() {
    if (playing) {
      queueRef.current = false;
      stop();
    } else if (src) {
      play(active);
    } else {
      playAll();
    }
  }

  function toggleTrack(t: HeroBeat) {
    if (t.id === active.id && playing) {
      queueRef.current = false;
      stop();
    } else {
      queueRef.current = false;
      play(t);
    }
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress((a.currentTime / (a.duration || 30)) * 100);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => {
      const advance = () => {
        if (!queueRef.current) return null;
        return listRef.current[indexRef.current + 1] || null;
      };
      const next = advance();
      if (next) {
        playRef.current(next);
      } else {
        queueRef.current = false;
        setPlaying(false);
        setProgress(0);
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      releaseAudio(a);
    };
  }, []);

  // Another preview took over the speakers — drop back to the paused state.
  useEffect(
    () =>
      onAudioChange((el) => {
        if (el !== audioRef.current) {
          setPlaying(false);
          setProgress(0);
        }
      }),
    [],
  );

  return (
    <div className="relative border border-white/[.14] bg-ink-850 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-white/[.10] pb-3">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/60">
          <span className={`h-1.5 w-1.5 rounded-full bg-brand-400 ${playing ? 'animate-pulse' : ''}`} />
          Beat preview
        </span>
        <div className="flex items-center gap-2.5">
          {list.length > 1 && (
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">
              {activeIndex + 1} / {list.length}
            </span>
          )}
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
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-24 w-[112px] shrink-0">
          <div
            aria-hidden="true"
            className={`absolute left-2 top-0 h-24 w-24 rounded-full border border-white/15 ${playing ? 'record-spin' : ''}`}
            style={{
              background: 'repeating-radial-gradient(circle at center, #1b1a16 0 2px, #282620 3px 4px)',
            }}
          >
            <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-brand-600" />
          </div>
          <div className="absolute left-0 top-0 z-10 h-24 w-24 overflow-hidden rounded-sm border border-white/10">
            <CoverArt beat={active as any} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="min-w-0">
          <Link
            href={`/beats/${active.slug}`}
            className="display block truncate text-[22px] text-white transition-colors hover:text-brand-200"
          >
            {active.title}
          </Link>
          <div className="mt-1 truncate text-[10px] uppercase tracking-[.12em] text-white/45">
            {active.genre} · {active.bpm} BPM · {active.musical_key}
          </div>
          <div className="mt-2 text-sm font-medium text-brand-200">{money(active.price_basic)} <span className="text-[11px] font-normal text-white/40">starting price</span></div>
        </div>
      </div>

      {/* src is assigned imperatively so React never reloads the element mid-playback */}
      <audio ref={audioRef} preload="none" />

      <div className="mt-5 flex items-center gap-2 sm:gap-3">
        {list.length > 1 && (
          <button
            onClick={() => step(-1)}
            disabled={activeIndex === 0}
            aria-label="Previous preview"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h2v14H6zM20 5.2v13.6a1 1 0 0 1-1.53.85L8.27 12.9a1 1 0 0 1 0-1.7l10.2-6.8A1 1 0 0 1 20 5.2Z" />
            </svg>
          </button>
        )}
        <button
          onClick={toggleQueue}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-500"
          aria-label={playing ? 'Pause' : 'Play previews'}
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
        {list.length > 1 && (
          <button
            onClick={() => step(1)}
            disabled={activeIndex >= list.length - 1}
            aria-label="Next preview"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 5h2v14h-2zM4 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L5.53 4.35A1 1 0 0 0 4 5.2Z" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[.14em] text-white/35">
            <span>{playing ? 'Playing preview' : 'Paused'}</span>
            <span className="truncate">{previewLabel(active)}</span>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-white/35">
          {dur ? fmt(dur) : '0:30'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            cart.add({
              beatId: active.id,
              slug: active.slug,
              title: active.title,
              cover: active.cover_url || '',
              license: 'basic',
              licenseName: 'Basic Lease (MP3)',
              price: Number(active.price_basic),
            });
            toast(`${active.title} added to cart`);
          }}
          className="btn-red text-xs"
        >
          Add to cart
        </button>
        <Link href={`/beats/${active.slug}`} className="btn-ghost text-xs">
          View licences
        </Link>
      </div>

      {list.length > 1 && (
        <div className="mt-5 border-t border-white/[.07] pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
              Preview queue
            </span>
            <button
              onClick={playAll}
              className="shrink-0 text-[10px] font-bold uppercase tracking-[.14em] text-brand-300 transition hover:text-brand-200"
            >
              Play all →
            </button>
          </div>
          <ul className="no-scrollbar -mx-1 max-h-[188px] space-y-0.5 overflow-y-auto px-1">
            {list.map((t, i) => {
              const isActive = t.id === active.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => toggleTrack(t)}
                    aria-current={isActive ? 'true' : undefined}
                    className="group flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-white/[.05]"
                    style={isActive ? { background: 'rgba(185,96,66,.16)' } : undefined}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm text-[10px] font-semibold tabular-nums ${
                        isActive ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {isActive && playing ? (
                        <span className="flex items-end gap-[2px]">
                          {[0, 1, 2].map((n) => (
                            <span
                              key={n}
                              className="eq-bar h-2.5 w-[2px] rounded-full bg-white"
                              style={{ animationDelay: `${n * 140}ms` }}
                            />
                          ))}
                        </span>
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[13px] font-bold ${
                          isActive ? 'text-white' : 'text-white/75 group-hover:text-white'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="block truncate text-[10px] uppercase tracking-[.14em] text-white/35">
                        {t.genre} · {t.bpm} BPM{isTaggedPreview(t) ? '' : ' · master'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[.14em] text-white/30">
                      {money(t.price_basic)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
