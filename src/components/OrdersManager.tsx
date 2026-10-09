'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useMoney } from '@/components/SettingsProvider';
import { timeAgo } from '@/lib/utils';

export type AdminOrder = {
  id: number;
  reference: string;
  name: string;
  email: string;
  total: number;
  status: string;
  method: string;
  channel: string;
  created_at: string;
  paid_at: string | null;
  items: {
    id: number;
    beat_title: string;
    license: string;
    price: number;
    download_count: number;
    emailed_at: string | null;
  }[];
};

export default function OrdersManager({ orders }: { orders: AdminOrder[] }) {
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const money = useMoney();

  const shown = orders.filter((o) => (filter === 'all' ? true : o.status === filter));

  async function act(order: AdminOrder, action: string) {
    setBusy(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      toast(
        action === 'resend'
          ? 'Delivery email sent again'
          : action === 'mark-paid'
            ? 'Marked as paid and files emailed'
            : action === 'reset-downloads'
              ? 'Download counters reset'
              : 'Updated',
      );
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Action failed', 'err');
    } finally {
      setBusy(null);
    }
  }

  const statusChip = (s: string) => (
    <span
      className={`chip ${
        s === 'paid'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : s === 'pending'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : s === 'refunded'
              ? 'border-white/10 bg-white/5 text-white/50'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
      }`}
    >
      {s}
    </span>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'paid', 'pending', 'failed', 'refunded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
              filter === f
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-white/10 bg-white/[.03] text-white/50 hover:text-white'
            }`}
          >
            {f}
            <span className="ml-1.5 opacity-60">
              {f === 'all' ? orders.length : orders.filter((o) => o.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="card px-6 py-14 text-center text-sm text-white/40">No orders here.</div>
        )}

        {shown.map((o) => (
          <div key={o.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              className="flex w-full flex-wrap items-center gap-4 p-5 text-left transition hover:bg-white/[.02]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] text-white/60">{o.reference}</span>
                  {statusChip(o.status)}
                  {o.items.every((i) => i.emailed_at) && (
                    <span className="chip border-brand-500/25 bg-brand-950/40 text-brand-300">
                      emailed
                    </span>
                  )}
                </div>
                <div className="mt-1.5 truncate text-[14px] font-bold text-white">{o.name}</div>
                <div className="truncate text-[11px] text-white/35">
                  {o.email} · {o.method || '—'} · {timeAgo(o.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="display text-xl text-white">{money(o.total)}</span>
                <span className="text-white/25">{expanded === o.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded === o.id && (
              <div className="border-t border-white/[.07] bg-ink-900/40 p-5">
                <div className="space-y-2">
                  {o.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-white">{it.beat_title}</div>
                        <div className="text-[11px] text-brand-300">{it.license}</div>
                      </div>
                      <div className="text-right text-[11px] text-white/35">
                        <div className="text-[13px] font-bold text-white">{money(it.price)}</div>
                        {it.download_count} download{it.download_count === 1 ? '' : 's'} ·{' '}
                        {it.emailed_at ? `emailed ${timeAgo(it.emailed_at)}` : 'not emailed'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => act(o, 'resend')}
                    disabled={busy === o.id}
                    className="btn-red !px-4 !py-2 text-[11px]"
                  >
                    Resend files by email
                  </button>
                  {o.status !== 'paid' && (
                    <button
                      onClick={() => act(o, 'mark-paid')}
                      disabled={busy === o.id}
                      className="btn-ghost !px-4 !py-2 text-[11px]"
                    >
                      Mark as paid &amp; deliver
                    </button>
                  )}
                  <button
                    onClick={() => act(o, 'reset-downloads')}
                    disabled={busy === o.id}
                    className="btn-ghost !px-4 !py-2 text-[11px]"
                  >
                    Reset download counters
                  </button>
                  {o.status === 'paid' && (
                    <button
                      onClick={() => act(o, 'refund')}
                      disabled={busy === o.id}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      Refund
                    </button>
                  )}
                </div>

                <p className="mt-3 text-[11px] text-white/25">
                  Channel: {o.channel || '—'} · Placed {o.created_at}
                  {o.paid_at ? ` · Paid ${o.paid_at}` : ''}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
