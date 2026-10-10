import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100svh-68px)] items-center border-b border-white/[.10] bg-ink-900">
      <div className="container-x grid gap-8 py-20 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-14">
        <div className="display text-[clamp(5rem,18vw,11rem)] leading-none text-brand-300">404</div>
        <div className="max-w-xl border-t border-white/[.12] pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">Not found</p>
          <h1 className="display text-[clamp(1.8rem,4vw,2.7rem)] text-white">We couldn&apos;t find that page.</h1>
          <p className="mt-4 text-sm leading-6 text-white/60">
            The link may be old, or the page may have moved. Head back to the catalogue and keep looking.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/beats" className="btn-red">Browse beats</Link>
            <Link href="/" className="btn-ghost">Back home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
