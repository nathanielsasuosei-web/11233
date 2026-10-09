'use client';

import { useEffect } from 'react';
import { youtubeId } from '@/lib/utils';

export default function VideoModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const yt = youtubeId(url);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-3.5">
          <span className="truncate text-sm font-semibold text-white">{title || 'Video'}</span>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
            aria-label="Close video"
          >
            ✕
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          {yt ? (
            <iframe
              key={yt}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              key={url}
              className="absolute inset-0 h-full w-full"
              src={url}
              controls
              autoPlay
              playsInline
            />
          )}
        </div>
      </div>
    </div>
  );
}
