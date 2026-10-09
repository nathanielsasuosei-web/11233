'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from './Toast';

export const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '◎', exact: true },
  { href: '/admin/beats', label: 'Beats', icon: '🎵' },
  { href: '/admin/videos', label: 'Videos', icon: '🎬' },
  { href: '/admin/orders', label: 'Orders', icon: '🧾' },
  { href: '/admin/bookings', label: 'Studio', icon: '🎙️' },
  { href: '/admin/artists', label: 'Artists', icon: '👤' },
  { href: '/admin/messages', label: 'Messages', icon: '✉️' },
  { href: '/admin/outbox', label: 'Email outbox', icon: '📤' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminNav({
  name,
  badges,
}: {
  name: string;
  badges: { messages: number; orders: number; bookings?: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch('/api/auth/logout?type=admin', { method: 'POST' });
    toast('Logged out');
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24">
          <div className="card overflow-hidden">
            <div className="border-b border-white/[.07] p-5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-black text-white">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div className="mt-3 truncate text-[14px] font-bold text-white">{name}</div>
              <div className="text-[11px] uppercase tracking-[.14em] text-brand-400">Producer</div>
            </div>

            <nav className="p-2">
              {ADMIN_LINKS.map((l) => {
                const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition ${
                      active
                        ? 'bg-brand-500/15 text-brand-200'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="w-4 text-center text-[13px]">{l.icon}</span>
                    <span className="flex-1">{l.label}</span>
                    {l.href === '/admin/messages' && badges.messages > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-black text-white">
                        {badges.messages}
                      </span>
                    )}
                    {l.href === '/admin/orders' && badges.orders > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
                        {badges.orders}
                      </span>
                    )}
                    {l.href === '/admin/bookings' && (badges.bookings || 0) > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-black text-white">
                        {badges.bookings}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-1 border-t border-white/[.07] p-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <span className="w-4 text-center">↗</span>
                View store
              </Link>
              <button
                onClick={logout}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-white/40 transition hover:bg-brand-500/10 hover:text-brand-300"
              >
                <span className="w-4 text-center">→</span>
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* mobile */}
      <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:hidden">
        {ADMIN_LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                active
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-white/10 bg-white/[.03] text-white/50'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="whitespace-nowrap rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-white/50"
        >
          Log out
        </button>
      </div>
    </>
  );
}
