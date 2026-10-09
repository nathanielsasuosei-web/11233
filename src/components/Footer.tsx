import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

export default function Footer({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const studio = settings.studio_name || 'PROJECT 1';
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/[.07] bg-ink-900">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[900px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[100px]" />
      <div className="container-x relative py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="display text-2xl tracking-tight">{studio}</div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
              {settings.tagline}. Built for artists who want radio-ready sound without the
              label budget.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Afrobeats', 'Drill', 'Amapiano', 'Trap'].map((g) => (
                <Link key={g} href={`/beats?genre=${g}`} className="chip hover:border-brand-500/40 hover:text-white">
                  {g}
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-[.16em] text-white/35">
                New beats, every Friday
              </div>
              <SubscribeForm />
            </div>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[.18em] text-white/35">
              Store
            </div>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link className="hover:text-brand-300" href="/beats">All beats</Link></li>
              <li><Link className="hover:text-brand-300" href="/previews">Beat previews</Link></li>
              <li><Link className="hover:text-brand-300" href="/studio">Book studio time</Link></li>
              <li><Link className="hover:text-brand-300" href="/videos">Videos</Link></li>
              <li><Link className="hover:text-brand-300" href="/licensing">Licensing</Link></li>
              <li><Link className="hover:text-brand-300" href="/checkout">Checkout</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[.18em] text-white/35">
              Account
            </div>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link className="hover:text-brand-300" href="/register">Create account</Link></li>
              <li><Link className="hover:text-brand-300" href="/login">Log in</Link></li>
              <li><Link className="hover:text-brand-300" href="/dashboard">My library</Link></li>
              <li><Link className="hover:text-brand-300" href="/admin">Producer login</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[.18em] text-white/35">
              Get in touch
            </div>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li>{settings.support_email}</li>
              <li>Mobile Money: {settings.momo_number}</li>
              <li>{settings.bank_name} · {settings.bank_account_number}</li>
            </ul>
            <Link href="/contact" className="btn-red mt-5 !px-5 !py-2.5 text-xs">
              Send a message
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[.06] pt-7 text-[11px] uppercase tracking-[.16em] text-white/25 sm:flex-row">
          <span>© {new Date().getFullYear()} {studio}. All rights reserved.</span>
          <span>Instant delivery · Mobile Money &amp; Bank transfer</span>
        </div>
      </div>
    </footer>
  );
}
