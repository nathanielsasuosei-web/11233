import Link from 'next/link';
import HeroCanvas from '@/components/HeroCanvas';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100svh-68px)] items-center overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-700/20 blur-[120px]" />
      <HeroCanvas className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,transparent_25%,rgba(8,8,10,.9)_100%)]" />

      <div className="container-x relative text-center">
        <div className="display text-[clamp(5rem,20vw,12rem)] leading-[.8] text-brand-500/80">404</div>
        <h1 className="display mt-4 text-[clamp(1.6rem,4vw,2.6rem)] text-white">
          THIS TRACK DOESN&apos;T EXIST
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/45">
          The page you were looking for has been moved, renamed, or never made it out of the
          session. Let&apos;s get you back to the music.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/beats" className="btn-red !px-8 !py-4 text-sm">
            Browse beats
          </Link>
          <Link href="/" className="btn-ghost !px-8 !py-4 text-sm">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
