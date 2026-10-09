'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './Toast';

function fmt(s: number) {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Deterministic fake waveform so every beat looks distinct without decoding audio. */
function useWaveform(seed: string, bars = 96) {
  return useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      h = Math.imul(h ^ (h >>> 13), 2246822519);
      h ^= h >>> 15;
      const r = ((h >>> 0) % 1000) / 1000;
      const envelope = 0.45 + 0.55 * Math.sin((i / bars) * Math.PI * 3.1);
      out.push(Math.max(0.14, Math.min(1, r * 0.75 * envelope + 0.22)));
    }
    return out;
  }, [seed, bars]);
}

export default function BeatPreviewPlayer({
  src,
  title,
  beatId,
  label = 'tagged preview · 30s',
}: {
  src?: string;
  title: string;
  beatId?: number;
  /** What the visitor is hearing — tagged clip or full master. */
  label?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const counted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [err, setErr] = useState(false);
  const toast = useToast();
  const wave = useWaveform(title + (src || ''));

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const t = () => setTime(a.currentTime);
    const m = () => setDur(a.duration || 0);
    const e = () => {
      setPlaying(false);
      setTime(0);
    };
    const onErr = () => setErr(true);
    a.addEventListener('timeupdate', t);
    a.addEventListener('loadedmetadata', m);
    a.addEventListener('ended', e);
    a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('timeupdate', t);
      a.removeEventListener('loadedmetadata', m);
      a.removeEventListener('ended', e);
      a.removeEventListener('error', onErr);
    };
  }, []);

  const pct = dur ? (time / dur) * 100 : 0;

  function toggle() {
    const a = ref.current;
    if (!a || !src) {
      toast('No preview file uploaded for this beat', 'err');
      return;
    }
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(
        () => {
          setPlaying(true);
          if (!counted.current) {
            counted.current = true;
            fetch(`/api/beats/${beatId}/play`, { method: 'POST' }).catch(() => {});
          }
        },
        () => toast('Preview file missing — ask the producer to upload one', 'err'),
      );
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
    setTime(a.currentTime);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.08] bg-ink-850/70 p-4">
      {src && <audio ref={ref} src={src} preload="metadata" />}

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${
            playing
              ? 'bg-brand-500 text-white shadow-[0_0_30px_-6px_rgba(255,45,58,.9)]'
              : 'border border-white/15 bg-white/5 text-white hover:border-brand-500/60 hover:bg-brand-500/15'
          }`}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={seek}>
          <div className="flex h-12 items-center gap-[2px]">
            {wave.map((v, i) => {
              const played = (i / wave.length) * 100 <= pct;
              return (
                <span
                  key={i}
                  className={`w-full rounded-full transition-colors duration-150 ${
                    played ? 'bg-brand-500' : 'bg-white/12'
                  }`}
                  style={{ height: `${v * 100}%` }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold tabular-nums uppercase tracking-[.12em] text-white/35">
            <span>{fmt(time)}</span>
            <span className="text-white/25">{err ? 'preview unavailable' : label}</span>
            <span>{dur ? fmt(dur) : '0:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
