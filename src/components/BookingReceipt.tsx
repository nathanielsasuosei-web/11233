'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type BookingView = {
  reference: string;
  service_title: string;
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
  created_at: string;
  cancel_reason?: string;
};

const LABEL: Record<string, { text: string; tone: string }> = {
  pending: { text: 'Deposit pending', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  deposit_paid: {
    text: 'Slot locked — balance at studio',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  confirmed: { text: 'Confirmed', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  completed: { text: 'Session complete', tone: 'border-white/10 bg-white/5 text-white/60' },
  cancelled: { text: 'Cancelled', tone: 'border-red-500/30 bg-red-500/10 text-red-300' },
  expired: { text: 'Hold expired', tone: 'border-white/10 bg-white/5 text-white/50' },
  refunded: { text: 'Cancelled · deposit returned', tone: 'border-white/10 bg-white/5 text-white/50' },
};

export function BookingStatusChip({ status }: { status: string }) {
  const l = LABEL[status] || { text: status, tone: 'border-white/10 bg-white/5 text-white/60' };
  return <span className={`chip ${l.tone}`}>{l.text}</span>;
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function BookingReceipt({
  booking,
  policy,
  address,
  phone,
  compact = false,
}: {
  booking: BookingView;
  policy?: string;
  address?: string;
  phone?: string;
  compact?: boolean;
}) {
  const money = useMoney();
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const canPay = booking.status === 'pending';
  const paid = booking.status === 'deposit_paid' || booking.status === 'confirmed';

  async function pay() {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.reference }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not start the payment');
      window.location.href = json.authorization_url;
    } catch (err: any) {
      toast(err.message || 'Could not start the payment', 'err');
      setBusy(false);
    }
  }

  async function release() {
    if (!confirm('Release this slot? Nothing has been charged.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/studio/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.reference }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not release the slot');
      toast('Slot released');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Could not release the slot', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[.07] px-5 py-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
            Booking {booking.reference}
          </div>
          <div className="display mt-1.5 truncate text-xl text-white">
            {booking.hours}h {booking.service_title}
          </div>
        </div>
        <BookingStatusChip status={booking.status} />
      </div>

      <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">When</dt>
          <dd className="mt-1 text-[14px] font-bold text-white">
            {dayLabel(booking.session_date)}
            <span className="text-white/45">
              {' '}
              · {booking.start_time}–{booking.end_time}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Deposit</dt>
          <dd className="mt-1 text-[14px] font-bold text-emerald-300">
            {money(booking.deposit)}
            <span className="text-white/35"> · {booking.deposit_percent}%</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
            Balance at the studio
          </dt>
          <dd className="mt-1 text-[14px] font-bold text-white">{money(booking.balance)}</dd>
        </div>
        {!compact && (
          <>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Artist</dt>
              <dd className="mt-1 text-[13px] text-white/70">
                {booking.name}
                {booking.phone ? ` · ${booking.phone}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Paid with</dt>
              <dd className="mt-1 text-[13px] text-white/70">
                {booking.paid_at ? booking.method || 'Mobile Money' : 'Not paid yet'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Session total</dt>
              <dd className="mt-1 text-[13px] text-white/70">{money(booking.price)}</dd>
            </div>
          </>
        )}
        {booking.notes && (
          <div className="sm:col-span-3">
            <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
              Notes for the engineer
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-white/60">
              {booking.notes}
            </dd>
          </div>
        )}
        {booking.cancel_reason && (
          <div className="sm:col-span-3">
            <dt className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Note</dt>
            <dd className="mt-1 text-[13px] text-white/60">{booking.cancel_reason}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[.07] px-5 py-4">
        {canPay && (
          <button onClick={pay} disabled={busy} className="btn-red !px-5 !py-2.5 text-xs">
            {busy ? 'Starting payment…' : `Pay ${money(booking.deposit)} deposit`}
          </button>
        )}
        {canPay && (
          <button
            onClick={release}
            disabled={busy}
            className="rounded-full border border-white/10 bg-white/[.03] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/45 transition hover:border-red-500/40 hover:text-red-200"
          >
            Release hold
          </button>
        )}
        {paid && (
          <span className="text-[11px] text-white/40">
            Bring {money(booking.balance)} on the day — MoMo or bank on the spot.
          </span>
        )}
        <a
          href={`/api/studio/${booking.reference}/ics`}
          className="btn-ghost !px-4 !py-2 text-[11px]"
          download
        >
          Add to calendar
        </a>
        <Link
          href="/contact"
          className="ml-auto text-[11px] font-bold uppercase tracking-[.14em] text-white/35 transition hover:text-brand-300"
        >
          Need to move it?
        </Link>
      </div>

      {(policy || address) && !compact && (
        <div className="grid gap-4 border-t border-white/[.07] bg-white/[.015] px-5 py-4 sm:grid-cols-2">
          {policy && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Studio policy
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">{policy}</p>
            </div>
          )}
          {(address || phone) && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Where to go
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">
                {address}
                {phone && (
                  <>
                    <br />
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-brand-300 hover:underline">
                      {phone}
                    </a>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
