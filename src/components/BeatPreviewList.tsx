'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { claimAudio, onAudioChange, releaseAudio } from '@/lib/audioBus';
import { isTaggedPreview, previewLabel, previewSrc } from '@/lib/preview';
import { CoverArt, type BeatLite } from './BeatCard';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/**
 * Flat, playable listing of every beat preview — one row per beat, one shared
 * audio element, and a queue that can run the whole catalogue top to bottom.
 */
export default function BeatPreviewList({ beats }: { beats: BeatLite[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playRef = useRef<(b: BeatLite) => void>(() => {});
  const queueRef = useRef(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  // Measured lengths, filled in as each preview's metadata loads.
  const [durations, setDurations] = useState<Record<number, number>>({});
  const money = useMoney();
  const toast = useToast();

  const rows = useMemo(() => beats.map((b) => ({ beat: b, src: previewSrc(b) })), [beats]);
  const playable = useMemo(() => rows.filter((r) => Boolean(r.src)), [rows]);
  const activeIndex = rows.findIndex((r) => r.beat.id === activeId);
  const active = activeIndex >= 0 ? rows[activeIndex] : null;
  const duration = active ? durations[active.beat.id] || 0 : 0;

  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const play = useCallback(
    (beat: BeatLite) => {
      const a = audioRef.current;
      if (!a) return;
      const src = previewSrc(beat);
      if (!src) {
        toast('No preview uploaded for this beat yet', 'err');
        return;
      }
      const target = new URL(src, window.location.href).href;
      if (a.src !== target) {
        a.src = src;
        a.load();
        setTime(0);
      }
      activeIdRef.current = beat.id;
      setActiveId(beat.id);
      claimAudio(a);
      a.play().then(
        () => setPlaying(true),
        () => toast('Preview could not be played', 'err'),
      );
    },
    [toast],
  );

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  function stop() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      releaseAudio(a);
    }
    queueRef.current = false;
    setPlaying(false);
    setTime(0);
  }

  function toggle(beat: BeatLite) {
    if (beat.id === activeId && playing) {
      stop();
    } else {
      queueRef.current = false;
      play(beat);
    }
  }

  /** Runs every preview in the list, one after another. */
  function playAll() {
    const first = playable[0];
    if (!first) {
      toast('No previews uploaded yet', 'err');
      return;
    }
    queueRef.current = true;
    play(first.beat);
  }

  const seeking = playing && queueRef.current;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => {
      const id = activeIdRef.current;
      const d = a.duration;
      if (id == null || !d || !isFinite(d)) return;
      setDurations((prev) => (prev[id] === d ? prev : { ...prev, [id]: d }));
    };
    const onEnd = () => {
      setPlaying(false);
      setTime(0);
      if (!queueRef.current) return;
      const next = rowsRef.current.slice(indexRef.current + 1).find((r) => Boolean(r.src));
      if (next) playRef.current(next.beat);
      else queueRef.current = false;
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

  // A player somewhere else took over the speakers — fall back to paused.
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

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * a.duration;
    setTime(a.currentTime);
  }, []);

  if (!rows.length) {
    return (
      <div className="card grid place-items-center px-6 py-20 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.03] text-2xl">
          🎧
        </div>
        <h3 className="display text-xl text-white">No previews to list</h3>
        <p className="mt-2 max-w-sm text-sm text-white/45">
          Nothing matches this filter yet. Clear the search or pick another genre.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <audio ref={audioRef} preload="none" />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">
          <span className="h-[2px] w-5 bg-brand-500" />
          {playable.length} preview{playable.length === 1 ? '' : 's'} listed
          {playable.length !== rows.length && (
            <span className="normal-case tracking-normal text-white/25">
              · {rows.length - playable.length} without audio
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {playing && (
            <button onClick={stop} className="btn-dark !px-3.5 !py-1.5 text-[11px]">
              Stop
            </button>
          )}
          <button
            onClick={() => (seeking ? stop() : playAll())}
            className="btn-red !px-4 !py-1.5 text-[11px]"
          >
            {seeking ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1.2" />
                  <rect x="14" y="5" width="4" height="14" rx="1.2" />
                </svg>
                Playing all
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
                </svg>
                Play every preview
              </>
            )}
          </button>
        </div>
      </div>

      <ol className="divide-y divide-white/[.05]">
        {rows.map(({ beat, src }, i) => {
          const isActive = beat.id === activeId;
          const isPlaying = isActive && playing;
          const known = durations[beat.id] || 0;
          const pct = isActive && duration ? (time / duration) * 100 : 0;
          return (
            <li
              key={beat.id}
              className={`group relative transition-colors ${
                isActive ? 'bg-brand-500/[.08]' : 'hover:bg-white/[.03]'
              }`}
            >
              <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                <span className="display w-6 shrink-0 text-right text-[13px] tabular-nums text-white/25">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <button
                  onClick={() => toggle(beat)}
                  disabled={!src}
                  aria-label={isPlaying ? `Pause ${beat.title}` : `Play ${beat.title} preview`}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                    isPlaying
                      ? 'bg-brand-500 text-white shadow-[0_0_24px_-6px_rgba(255,45,58,.9)]'
                      : 'border border-white/10 bg-white/5 text-white/80 hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-white/5'
                  }`}
                >
                  {isPlaying ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1.2" />
                      <rect x="14" y="5" width="4" height="14" rx="1.2" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
                    </svg>
                  )}
                </button>

                <Link
                  href={`/beats/${beat.slug}`}
                  className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-900"
                  aria-label={`${beat.title} details`}
                >
                  <CoverArt beat={beat} className="h-full w-full object-cover" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/beats/${beat.slug}`}
                    className="block truncate text-[14px] font-bold text-white transition hover:text-brand-300"
                  >
                    {beat.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-white/35">
                    <span className="truncate">{beat.genre}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-white/20" />
                    <span className="truncate">{isTaggedPreview(beat) ? 'tagged clip' : 'master'}</span>
                    <span className="hidden h-1 w-1 shrink-0 rounded-full bg-white/20 sm:block" />
                    <span className="hidden truncate sm:block">{beat.mood || '—'}</span>
                  </div>
                </div>

                <span className="hidden w-16 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/45 md:block">
                  {beat.bpm} BPM
                </span>
                <span className="hidden w-20 shrink-0 text-right text-[11px] uppercase tracking-[.1em] text-white/40 lg:block">
                  {beat.musical_key || '—'}
                </span>
                <span className="w-14 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/45">
                  {isActive ? fmt(time) : known ? fmt(known) : src ? '0:30' : '—'}
                </span>
                <span className="w-[4.6rem] shrink-0 text-right text-[12px] font-bold text-white">
                  {money(beat.price_basic)}
                </span>
                <Link
                  href={`/beats/${beat.slug}`}
                  className="btn-ghost hidden !px-3 !py-1.5 text-[11px] xl:inline-flex"
                >
                  Details
                </Link>
              </div>

              {isActive && src ? (
                <div className="h-[3px] w-full cursor-pointer bg-white/[.06]" onClick={seek}>
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-150"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              ) : !src ? (
                <div className="px-3 pb-2.5 pl-[3.4rem] sm:px-4 sm:pl-[3.75rem]">
                  <span className="chip !py-0.5 text-[9px] text-white/40">no preview uploaded</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {active && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.07] px-4 py-2.5 text-[10px] uppercase tracking-[.14em] text-white/35 sm:px-5">
          <span className="truncate">
            Now playing: <span className="text-white/70">{active.beat.title}</span>
          </span>
          <span className="truncate">{previewLabel(active.beat)}</span>
        </div>
      )}
    </div>
  );
}
