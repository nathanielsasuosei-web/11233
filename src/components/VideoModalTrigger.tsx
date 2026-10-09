'use client';

import { useState } from 'react';
import VideoModal from './VideoModal';

export default function VideoModalTrigger({
  url,
  title,
  label = 'Watch video',
}: {
  url: string;
  title?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/[.08] bg-ink-850/60 p-4 text-left transition hover:border-brand-500/40"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-white">{label}</span>
          <span className="block text-[11px] text-white/40">Opens in a player</span>
        </span>
      </button>
      <VideoModal open={open} onClose={() => setOpen(false)} url={url} title={title} />
    </>
  );
}
