'use client';

import { useState } from 'react';
import Link from 'next/link';
import VideoModal from './VideoModal';
import { youtubeId } from '@/lib/utils';

export type VideoLite = {
  id: number;
  title: string;
  description: string;
  source_type: string;
  video_url: string;
  thumbnail_url: string;
  beat_title: string | null;
  beat_slug: string | null;
};

export default function VideoCard({ video }: { video: VideoLite }) {
  const [open, setOpen] = useState(false);
  const yt = youtubeId(video.video_url);
  const thumb =
    video.thumbnail_url || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-2xl border border-white/[.07] bg-ink-850 text-left transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_24px_60px_-30px_rgba(255,45,58,.5)]"
      >
        <div className="relative aspect-video overflow-hidden bg-ink-900">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover opacity-80 transition-transform duration-[1200ms] group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-900 via-ink-900 to-ink-900">
              <span className="display text-4xl text-white/15">VIDEO</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
          <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-500/95 text-white shadow-[0_0_40px_-6px_rgba(255,45,58,.9)] transition group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
            </svg>
          </span>
          <span className="chip absolute bottom-3 left-3 border-white/10 bg-black/60">
            {video.source_type === 'youtube' ? 'YouTube' : 'Uploaded'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-[15px] font-bold text-white transition group-hover:text-brand-300">
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/40">
              {video.description}
            </p>
          )}
          {video.beat_title && video.beat_slug && (
            <Link
              href={`/beats/${video.beat_slug}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-950/40 px-3 py-1 text-[11px] font-bold text-brand-300 transition hover:bg-brand-500/20"
            >
              🎵 {video.beat_title}
            </Link>
          )}
        </div>
      </button>

      <VideoModal open={open} onClose={() => setOpen(false)} url={video.video_url} title={video.title} />
    </>
  );
}
