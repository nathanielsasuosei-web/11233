'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

const CHANNELS = [
  { id: 'mobile_money', label: 'MTN Mobile Money', icon: '📱' },
  { id: 'telecel', label: 'Telecel Cash', icon: '📶' },
  { id: 'at', label: 'AirtelTigo Money', icon: '📳' },
  { id: 'card', label: 'Card', icon: '💳' },
];

/** Demo-mode deposit screen — only rendered while no Paystack keys exist. */
export default function StudioSimulateClient({
  booking,
}: {
  booking: {
    reference: string;
    deposit: number;
    service_title: string;
    session_date: string;
    start_time: string;
    hours: number;
  };
}) {
  const [channel, setChannel] = useState('mobile_money');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const money = useMoney();

  const amount = money(booking.deposit || 0);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.reference, channel }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'Payment failed');
      toast('Deposit confirmed');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Payment failed', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/[.07] bg-ink-900/60 px-6 py-4">
        <div className="text-[10px] uppercase tracking-[.18em] text-white/35">Deposit due now</div>
        <div className="display mt-1 text-4xl text-white">{amount}</div>
        <div className="mt-1 text-[11px] text-white/30">
          {booking.hours}h {booking.service_title} · {booking.session_date} {booking.start_time} ·
          Ref {booking.reference}
        </div>
      </div>

      <div className="space-y-2.5 p-6">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
          Demo mode — choose a channel to approve the prompt
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[12px] font-bold transition ${
                channel === c.id
                  ? 'border-brand-500/60 bg-brand-500/[.08] text-white'
                  : 'border-white/[.08] bg-white/[.02] text-white/55 hover:text-white'
              }`}
            >
              <span className="text-base">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <button onClick={confirm} disabled={busy} className="btn-red mt-3 w-full !py-4 text-sm">
          {busy ? 'Approving…' : `Approve ${amount}`}
        </button>
        <p className="text-center text-[10px] uppercase tracking-[.14em] text-white/25">
          No Paystack keys are set, so this is a simulated approval.
        </p>
      </div>
    </div>
  );
}
