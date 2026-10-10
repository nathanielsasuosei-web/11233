import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import { listVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Videos — Project 1',
  description: 'Studio sessions, beat breakdowns and live sets.',
};

export default function VideosPage() {
  const videos = listVideos(24);

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
            <span className="h-px w-7 bg-brand-500" />
            From the room
          </div>
          <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
            Studio <span className="font-normal italic text-brand-300">videos.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            Beat breakdowns, studio sessions and live sets — see how the records get built.
          </p>
        </div>
      </Reveal>

      {videos.length === 0 ? (
        <div className="card grid place-items-center px-6 py-20 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-brand-300">No videos yet</p>
          <h3 className="display text-xl text-white">Nothing from the studio, yet.</h3>
          <p className="mt-2 max-w-sm text-sm text-white/55">
            New clips will appear here after they are added.
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
