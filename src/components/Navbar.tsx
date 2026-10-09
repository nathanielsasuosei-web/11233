'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { useSettings } from './SettingsProvider';

const LINKS = [
  { href: '/beats', label: 'Beats' },
  { href: '/videos', label: 'Videos' },
  { href: '/licensing', label: 'Licensing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar({
  isArtist,
  isAdmin,
}: {
  isArtist: boolean;
  isAdmin: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const cart = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobile(false), [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[.07] bg-ink-900/85 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-400 to-brand-700">
              <span className="absolute inset-0 grid place-items-center">
                <span className="eq-bar h-3 w-[2px] bg-white/90" style={{ animationDelay: '0ms' }} />
                <span
                  className="eq-bar mx-[2px] h-4 w-[2px] bg-white"
                  style={{ animationDelay: '140ms' }}
                />
                <span
                  className="eq-bar h-2.5 w-[2px] bg-white/90"
                  style={{ animationDelay: '280ms' }}
                />
              </span>
            </span>
            <span className="display text-[17px] tracking-tight">
              {settings.studio_name || 'BEATVAULT'}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    active ? 'text-white' : 'text-white/55 hover:text-white'
                  }`}
                >
                  {l.label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-[2px] rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => cart.setOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-brand-500/50 hover:bg-brand-500/10"
              aria-label="Open cart"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cart.count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-black text-white">
                  {cart.count}
                </span>
              )}
            </button>

            {isAdmin && (
              <Link href="/admin" className="btn-dark hidden !px-4 !py-2 text-xs sm:inline-flex">
                Studio
              </Link>
            )}

            {isArtist ? (
              <Link href="/dashboard" className="btn-red hidden !px-5 !py-2.5 text-xs sm:inline-flex">
                My Library
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/70 transition hover:text-white sm:block"
                >
                  Log in
                </Link>
                <Link href="/register" className="btn-red hidden !px-5 !py-2.5 text-xs sm:inline-flex">
                  Create account
                </Link>
              </>
            )}

            <button
              onClick={() => setMobile((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobile ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {/* mobile menu */}
        <div
          className={`overflow-hidden border-white/[.06] bg-ink-900/95 backdrop-blur-xl transition-all duration-400 lg:hidden ${
            mobile ? 'max-h-[420px] border-t' : 'max-h-0'
          }`}
        >
          <div className="container-x flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {isArtist || isAdmin ? (
                <Link href={isAdmin ? '/admin' : '/dashboard'} className="btn-red col-span-2 text-xs">
                  {isAdmin ? 'Studio dashboard' : 'My library'}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-xs">
                    Log in
                  </Link>
                  <Link href="/register" className="btn-red text-xs">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="h-[68px]" />
    </>
  );
}
