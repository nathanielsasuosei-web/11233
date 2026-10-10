import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

export default function Footer({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const studio = settings.studio_name || 'PROJECT 1';
  const producer = settings.producer_name || 'Independent producer';

  return (
    <footer className="mt-20 border-t border-white/[.10] bg-ink-900">
      <div className="container-x py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.35fr_.8fr_.8fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center border border-brand-500/45 font-serif text-sm text-white">
                P<span className="text-brand-300">1</span>
              </span>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[.16em] text-white">{studio}</div>
                <div className="mt-1 text-[10px] text-white/40">{producer}</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {settings.tagline || 'Independent beats and studio work.'}
            </p>
            <div className="mt-6">
              <div className="text-[11px] font-medium text-white/70">A note when new work lands</div>
              <SubscribeForm />
            </div>
          </div>

          <div>
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Listen</div>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link className="transition-colors hover:text-brand-200" href="/beats">All beats</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/previews">Preview queue</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/licensing">Licences</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/videos">Studio videos</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Studio</div>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link className="transition-colors hover:text-brand-200" href="/studio">Book a session</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/about">About the producer</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/contact">Get in touch</Link></li>
              <li><Link className="transition-colors hover:text-brand-200" href="/dashboard">My library</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Contact</div>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              Questions about a licence, session, or order? Send a message and include the track or order reference if you have one.
            </p>
            {settings.support_email && (
              <a href={`mailto:${settings.support_email}`} className="mt-3 inline-block break-all text-sm text-brand-200 transition-colors hover:text-white">
                {settings.support_email}
              </a>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[.09] pt-5 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {studio}. All rights reserved.</span>
          <span>Listen first · Choose your licence · Get to work</span>
        </div>
      </div>
    </footer>
  );
}
