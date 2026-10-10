'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { useSettings } from './SettingsProvider';

const LINKS = [
  { href: '/beats', label: 'Beats' },
  { href: '/previews', label: 'Previews' },
  { href: '/studio', label: 'Studio' },
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
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const cart = useCart();
  const { settings } = useSettings();

  useEffect(() => setMobile(false), [pathname]);

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-white/[.10] bg-ink-900/95 backdrop-blur-sm">
      <div className="container-x">
        <div className="flex min-h-[68px] items-center justify-between gap-4">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-3" aria-label={`${settings.studio_name || 'Project 1'} home`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-brand-500/50 font-serif text-[17px] tracking-[-.1em] text-white transition-colors group-hover:border-brand-300">
              P<span className="text-brand-300">1</span>
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12px] font-semibold uppercase tracking-[.16em] text-white">
                {settings.studio_name || 'PROJECT 1'}
              </span>
              <span className="mt-1 block truncate text-[10px] text-white/45">
                {settings.producer_name || 'Independent producer'}
              </span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link px-2.5 py-2 text-[12px] transition-colors ${
                    active ? 'text-white' : 'text-white/55 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => cart.setOpen(true)}
              className="relative grid h-10 w-10 place-items-center border border-white/15 text-white/80 transition-colors hover:border-brand-400/60 hover:text-white"
              aria-label={`Open cart${cart.count > 0 ? `, ${cart.count} items` : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              {cart.count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {cart.count}
                </span>
              )}
            </button>

            {isAdmin && (
              <Link href="/admin" className="btn-ghost hidden !px-3 !py-2 text-xs sm:inline-flex">
                Producer
              </Link>
            )}

            {isArtist ? (
              <Link href="/dashboard" className="btn-red hidden !px-4 !py-2 text-xs sm:inline-flex">
                My library
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden px-3 py-2 text-[12px] text-white/65 transition-colors hover:text-white sm:block"
                >
                  Sign in
                </Link>
                <Link href="/register" className="btn-red hidden !px-4 !py-2 text-xs sm:inline-flex">
                  Create account
                </Link>
              </>
            )}

            <button
              onClick={() => setMobile((value) => !value)}
              className="grid h-10 w-10 place-items-center border border-white/15 text-white transition-colors hover:border-white/35 xl:hidden"
              aria-label={mobile ? 'Close menu' : 'Open menu'}
              aria-expanded={mobile}
              aria-controls="mobile-navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                {mobile ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        <div
          id="mobile-navigation"
          aria-hidden={!mobile}
          className={`overflow-hidden border-white/[.09] transition-[max-height,opacity] duration-200 xl:hidden ${
            mobile ? 'max-h-[520px] border-t opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 py-4 sm:px-2">
            <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-x-4">
              {LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobile(false)}
                    aria-current={active ? 'page' : undefined}
                    tabIndex={mobile ? 0 : -1}
                    className={`border-b border-white/[.07] px-2 py-3 text-sm transition-colors ${
                      active ? 'text-brand-200' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {isArtist || isAdmin ? (
                <Link href={isAdmin ? '/admin' : '/dashboard'} tabIndex={mobile ? 0 : -1} className="btn-red col-span-2 text-xs">
                  {isAdmin ? 'Producer dashboard' : 'My library'}
                </Link>
              ) : (
                <>
                  <Link href="/login" tabIndex={mobile ? 0 : -1} className="btn-ghost text-xs">
                    Sign in
                  </Link>
                  <Link href="/register" tabIndex={mobile ? 0 : -1} className="btn-red text-xs">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
