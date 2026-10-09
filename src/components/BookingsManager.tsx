'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type AdminBooking = {
  id: number;
  reference: string;
  service_title: string;
  service_slug: string | null;
  hours: number;
  session_date: string;
  start_time: string;
  end_time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  price: number;
  deposit: number;
  balance: number;
  deposit_percent: number;
  status: string;
  method: string;
  paid_at: string | null;
  cancel_reason: string;
  artist_name: string | null;
  created_at: string;
};

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Awaiting deposit' },
  { id: 'deposit_paid', label: 'Deposits in' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled / refunded' },
  { id: 'all', label: 'All' },
];

const TONE: Record<string, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  deposit_paid: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  completed: 'border-white/10 bg-white/5 text-white/55',
  cancelled: 'border-red-500/30 bg-red-500/10 text-red-300',
  refunded: 'border-red-500/30 bg-red-500/10 text-red-300',
  expired: 'border-white/10 bg-white/5 text-white/40',
};

const DAY = new Date().toISOString().slice(0, 10);

export default function BookingsManager({ bookings }: { bookings: AdminBooking[] }) {
  const [filter, setFilter] = useState('upcoming');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  const money = useMoney();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const shown = useMemo(() => {
    const list = bookings.filter((b) => {
      if (filter === 'upcoming')
        return b.session_date >= DAY && ['pending', 'deposit_paid', 'confirmed'].includes(b.status);
      if (filter === 'all') return true;
      if (filter === 'cancelled') return ['cancelled', 'refunded', 'expired'].includes(b.status);
      return b.status === filter;
    });
    const needle = q.trim().toLowerCase();
    const searched = needle
      ? list.filter((b) =>
          `${b.name} ${b.email} ${b.phone} ${b.service_title} ${b.reference}`
            .toLowerCase()
            .includes(needle),
        )
      : list;
    return [...searched].sort((a, b) =>
      a.session_date === b.session_date
        ? a.start_time.localeCompare(b.start_time)
        : a.session_date.localeCompare(b.session_date),
    );
  }, [bookings, filter, q]);

  const byDay = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const b of shown) {
      const list = map.get(b.session_date) || [];
      list.push(b);
      map.set(b.session_date, list);
    }
    return [...map.entries()];
  }, [shown]);

  const counts = useMemo(
    () => ({
      upcoming: bookings.filter(
        (b) => b.session_date >= DAY && ['pending', 'deposit_paid', 'confirmed'].includes(b.status),
      ).length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      deposit_paid: bookings.filter((b) => b.status === 'deposit_paid').length,
    }),
    [bookings],
  );

  async function act(b: AdminBooking, action: string, extra: Record<string, string> = {}) {
    setBusy(b.id);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Action failed');
      toast(
        action === 'mark-paid'
          ? 'Deposit recorded — artist emailed'
          : action === 'complete'
            ? 'Marked complete'
            : action === 'resend'
              ? 'Confirmation sent again'
              : 'Booking updated',
      );
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Action failed', 'err');
    } finally {
      setBusy(null);
    }
  }

  async function cancel(b: AdminBooking, refund: boolean) {
    const reason = window.prompt(
      `${refund ? 'Refund' : 'Keep'} the ${money(b.deposit)} deposit and release ${b.session_date} ${b.start_time}? Add a note for the artist:`,
      refund ? 'Studio reschedule — deposit returned in full.' : 'Cancelled outside the 24-hour window.',
    );
    if (reason === null) return;
    await act(b, refund ? 'refund' : 'cancel', { reason, refund: refund ? '1' : '0' });
  }

  const chip = (s: string) => (
    <span className={`chip ${TONE[s] || 'border-white/10 bg-white/5 text-white/50'}`}>{s.replace('_', ' ')}</span>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artist, email, phone or reference…"
          className="input max-w-xs"
        />
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const n =
              f.id === 'upcoming'
                ? counts.upcoming
                : f.id === 'pending'
                  ? counts.pending
                  : f.id === 'deposit_paid'
                    ? counts.deposit_paid
                    : undefined;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[.1em] transition ${
                  filter === f.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-white/10 bg-white/[.03] text-white/50 hover:text-white'
                }`}
              >
                {f.label}
                {n !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      filter === f.id ? 'bg-black/25 text-white' : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!byDay.length ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-3 text-3xl">🎙️</div>
          <h3 className="display text-lg text-white">Nothing in this view</h3>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            When an artist pays a deposit on /studio, the slot lands here with the balance they owe
            on the day.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {byDay.map(([day, rows]) => (
            <div key={day} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[.18em] text-white/45">
                  {new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {day === DAY && <span className="ml-2 text-brand-300">· today</span>}
                </div>
                <div className="text-[11px] text-white/30">
                  {rows.reduce((s, r) => s + r.hours, 0)}h booked
                </div>
              </div>

              <ul className="divide-y divide-white/[.05]">
                {rows.map((b) => {
                  const isOpen = open === b.reference;
                  return (
                    <li key={b.id}>
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                        <button
                          onClick={() => setOpen(isOpen ? null : b.reference)}
                          className="w-[4.5rem] shrink-0 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="display block text-[15px] text-white">{b.start_time}</span>
                          <span className="text-[10px] uppercase tracking-[.14em] text-white/30">
                            → {b.end_time}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-bold text-white">
                            {b.service_title} · {b.hours}h{' '}
                            <span className="font-normal text-white/40">— {b.artist_name || b.name}</span>
                          </div>
                          <div className="truncate text-[11px] text-white/35">
                            {b.email}
                            {b.phone ? ` · ${b.phone}` : ''} · {b.reference}
                          </div>
                        </div>

                        <div className="hidden shrink-0 text-right sm:block">
                          <div className="text-[12px] font-bold text-emerald-300">
                            {money(b.deposit)} in
                          </div>
                          <div className="text-[11px] text-white/40">
                            {money(b.balance)} due
                          </div>
                        </div>

                        {chip(b.status)}

                        <div className="flex shrink-0 items-center gap-2">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => act(b, 'mark-paid')}
                              disabled={busy === b.id}
                              className="btn-red !px-3.5 !py-1.5 text-[11px]"
                            >
                              {busy === b.id ? 'Saving…' : 'Mark deposit in'}
                            </button>
                          )}
                          {(b.status === 'deposit_paid' || b.status === 'confirmed') && (
                            <button
                              onClick={() => act(b, 'complete')}
                              disabled={busy === b.id}
                              className="btn-dark !px-3.5 !py-1.5 text-[11px]"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => setOpen(isOpen ? null : b.reference)}
                            className="btn-ghost !px-3 !py-1.5 text-[11px]"
                          >
                            {isOpen ? 'Hide' : 'Open'}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="animate-fade-up border-t border-white/[.05] bg-ink-900/50 px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                                Notes from the artist
                              </div>
                              <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-white/60">
                                {b.notes || '—'}
                              </p>
                              {b.cancel_reason && (
                                <>
                                  <div className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                                    Closing note
                                  </div>
                                  <p className="mt-1.5 text-[12px] text-white/60">{b.cancel_reason}</p>
                                </>
                              )}
                            </div>
                            <div>
                              <div className="grid grid-cols-3 gap-2 text-center lg:grid-cols-1">
                                {[
                                  ['Session', money(b.price)],
                                  [`Deposit (${b.deposit_percent}%)`, money(b.deposit)],
                                  ['Balance on the day', money(b.balance)],
                                ].map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2"
                                  >
                                    <div className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                                      {k}
                                    </div>
                                    <div className="mt-0.5 text-[13px] font-bold text-white">{v}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                                <Link
                                  href={`/studio/booking/${b.reference}`}
                                  target="_blank"
                                  className="btn-ghost !px-3.5 !py-1.5 text-[11px]"
                                >
                                  Artist link
                                </Link>
                                <button
                                  onClick={() => act(b, 'resend')}
                                  disabled={busy === b.id}
                                  className="btn-dark !px-3.5 !py-1.5 text-[11px]"
                                >
                                  Resend email
                                </button>
                                {['pending', 'deposit_paid', 'confirmed'].includes(b.status) && (
                                  <>
                                    <button
                                      onClick={() => cancel(b, false)}
                                      disabled={busy === b.id}
                                      className="rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
                                    >
                                      Cancel · keep deposit
                                    </button>
                                    {b.status !== 'pending' && (
                                      <button
                                        onClick={() => cancel(b, true)}
                                        disabled={busy === b.id}
                                        className="rounded-full border border-white/10 bg-white/[.03] px-3.5 py-1.5 text-[11px] font-bold text-white/55 transition hover:text-white"
                                      >
                                        Cancel · refund
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
