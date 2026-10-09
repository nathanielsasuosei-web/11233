'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

const CHANNELS = [
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱', detail: 'MTN · Vodafone · AirtelTigo' },
  { id: 'bank', label: 'Bank transfer', icon: '🏦', detail: 'Instant transfer' },
  { id: 'card', label: 'Card', icon: '💳', detail: 'Visa · Mastercard' },
];

export default function SimulateClient({
  reference,
  total,
  items,
  currencySymbol,
  method,
}: {
  reference: string;
  total: number;
  items: { title: string; license: string; price: number }[];
  currencySymbol: string;
  method: string;
}) {
  const [channel, setChannel] = useState(
    method === 'Bank Transfer' ? 'bank' : method === 'Card' ? 'card' : 'mobile_money',
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const money = (n: number) =>
    currencySymbol + (n / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 });

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, channel }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Payment failed');
      window.location.href = `/checkout/success?reference=${reference}`;
    } catch (e: any) {
      toast(e.message || 'Payment failed', 'err');
      setBusy(false);
    }
  }

  async function fail() {
    setBusy(true);
    await fetch('/api/checkout/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: reference + '__nope', channel }),
    }).catch(() => {});
    window.location.href = `/checkout/failed?reference=${reference}`;
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/[.07] bg-ink-900/60 px-6 py-4">
        <div className="text-[10px] uppercase tracking-[.18em] text-white/35">Amount due</div>
        <div className="display mt-1 text-4xl text-white">{money(total)}</div>
        <div className="mt-1 text-[11px] text-white/30">Reference {reference}</div>
      </div>

      <ul className="divide-y divide-white/[.06]">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between px-6 py-3.5">
            <div>
              <div className="text-[13px] font-bold text-white">{it.title}</div>
              <div className="text-[11px] text-brand-300">{it.license}</div>
            </div>
            <span className="text-[13px] font-bold text-white">{money(it.price)}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2.5 p-6">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
          Choose a channel
        </div>
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              channel === c.id
                ? 'border-brand-500/60 bg-brand-500/[.08]'
                : 'border-white/[.08] bg-white/[.02] hover:border-white/20'
            }`}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="flex-1">
              <span className="block text-[13px] font-bold text-white">{c.label}</span>
              <span className="block text-[11px] text-white/40">{c.detail}</span>
            </span>
            <span
              className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                channel === c.id ? 'border-brand-500' : 'border-white/25'
              }`}
            >
              {channel === c.id && <span className="h-2 w-2 rounded-full bg-brand-500" />}
            </span>
          </button>
        ))}

        <button onClick={confirm} disabled={busy} className="btn-red mt-5 w-full !py-4 text-sm">
          {busy ? 'Processing…' : `Pay ${money(total)}`}
        </button>
        <button
          onClick={fail}
          disabled={busy}
          className="w-full text-[11px] font-semibold uppercase tracking-[.14em] text-white/25 transition hover:text-white/60"
        >
          Simulate a failed payment
        </button>
      </div>
    </div>
  );
}
