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
      <article className="group overflow-hidden rounded-sm border border-white/[.11] bg-ink-850 transition-colors duration-200 hover:border-brand-400/55">
        <button
          onClick={() => setOpen(true)}
          aria-label={`Play ${video.title}`}
          className="block w-full text-left"
        >
          <div className="relative aspect-video overflow-hidden bg-ink-900">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-ink-800">
                <span className="font-serif text-4xl italic text-white/25">Studio notes</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white transition-colors group-hover:bg-brand-500">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true">
                <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" />
              </svg>
            </span>
            <span className="chip absolute bottom-3 left-3 border-white/10 bg-black/60">
              {video.source_type === 'youtube' ? 'YouTube' : 'Uploaded'}
            </span>
          </div>
          <div className="p-4 pb-2">
            <h3 className="line-clamp-2 text-[15px] font-semibold text-white transition-colors group-hover:text-brand-200">
              {video.title}
            </h3>
            {video.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50">
                {video.description}
              </p>
            )}
          </div>
        </button>
        {video.beat_title && video.beat_slug && (
          <div className="px-4 pb-4">
            <Link
              href={`/beats/${video.beat_slug}`}
              className="inline-flex items-center gap-1.5 border border-brand-500/30 px-2.5 py-1 text-[11px] font-medium text-brand-200 transition-colors hover:bg-brand-500/10"
            >
              {video.beat_title}
            </Link>
          </div>
        )}
      </article>
      <VideoModal open={open} onClose={() => setOpen(false)} url={video.video_url} title={video.title} />
    </>
  );
}
