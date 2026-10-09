import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import { listVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Videos — Beatvault',
  description: 'Studio sessions, beat breakdowns and live sets.',
};

export default function VideosPage() {
  const videos = listVideos(24);

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
            <span className="h-[2px] w-7 bg-brand-500" />
            Studio feed
          </div>
          <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
            VIDEOS &amp; <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">BREAKDOWNS</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/45">
            Beat breakdowns, studio sessions and live sets — see how the records get built.
          </p>
        </div>
      </Reveal>

      {videos.length === 0 ? (
        <div className="card grid place-items-center px-6 py-20 text-center">
          <div className="mb-4 text-4xl">🎬</div>
          <h3 className="display text-xl text-white">No videos yet</h3>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            The producer has not uploaded any videos. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={Math.min(i * 70, 400)}>
              <VideoCard video={v} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
