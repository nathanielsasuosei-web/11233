'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

const METHODS = [
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    sub: 'MTN · Vodafone · AirtelTigo',
    icon: '📱',
    networks: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    sub: 'Instant bank transfer / USSD',
    icon: '🏦',
    networks: [],
  },
  {
    id: 'card',
    label: 'Card',
    sub: 'Visa · Mastercard · Verve',
    icon: '💳',
    networks: [],
  },
] as const;

export default function CheckoutClient({
  loggedIn,
  email,
  name,
  demo,
}: {
  loggedIn: boolean;
  email: string;
  name: string;
  demo: boolean;
}) {
  const cart = useCart();
  const money = useMoney();
  const toast = useToast();
  const [method, setMethod] = useState<string>('mobile_money');
  const [network, setNetwork] = useState('MTN Mobile Money');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function pay() {
    if (!cart.items.length) return;
    if (method === 'mobile_money' && phone.replace(/\D/g, '').length < 9) {
      toast('Enter the Mobile Money number that will pay', 'err');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ beatId: i.beatId, license: i.license })),
          method,
          phone: network ? `${network} · ${phone}` : phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || 'Checkout failed', 'err');
        if (json.needAuth) window.location.href = '/login?next=/checkout';
        return;
      }
      cart.clear();
      window.location.href = json.authorization_url;
    } catch {
      toast('Network error — please try again', 'err');
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-brand-500/25 bg-brand-950/50 text-2xl">
          🔐
        </div>
        <h1 className="display text-2xl text-white">Log in to check out</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/45">
          Create a free artist account so your beats, invoices and download links live in one
          place — and so we know where to email the files.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/login?next=/checkout" className="btn-red !px-7 text-sm">
            Log in
          </Link>
          <Link href="/register?next=/checkout" className="btn-ghost !px-7 text-sm">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.03] text-2xl">
          🛒
        </div>
        <h1 className="display text-2xl text-white">Your cart is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-white/45">
          Add a beat and pick a licence to get started.
        </p>
        <Link href="/beats" className="btn-red mt-7 !px-7 text-sm">
          Browse beats
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1.25fr_.75fr]">
      {/* ---- payment ---- */}
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">1 · HOW DO YOU WANT TO PAY?</h2>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  method === m.id
                    ? 'border-brand-500/60 bg-brand-500/[.08] shadow-[0_0_40px_-20px_rgba(255,45,58,.9)]'
                    : 'border-white/[.08] bg-white/[.02] hover:border-white/20'
                }`}
              >
                <div className="text-xl">{m.icon}</div>
                <div className="mt-2 text-[13px] font-bold text-white">{m.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-white/40">{m.sub}</div>
              </button>
            ))}
          </div>

          {method === 'mobile_money' && (
            <div className="mt-5 animate-fade-up grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="input appearance-none"
                >
                  {METHODS[0].networks.map((n) => (
                    <option key={n} value={n} className="bg-ink-800">
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mobile money number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="055 000 0000"
                  className="input"
                  inputMode="tel"
                />
              </div>
            </div>
          )}

          {method === 'bank' && (
            <p className="mt-4 animate-fade-up rounded-xl border border-white/[.07] bg-white/[.02] p-4 text-[12px] leading-relaxed text-white/50">
              You&apos;ll be shown a one-time account number to transfer to. The payment is
              confirmed automatically within a few seconds and your files are emailed straight
              away.
            </p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">2 · WHERE DO WE SEND THE FILES?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input value={name} disabled className="input opacity-60" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={email} disabled className="input opacity-60" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/35">
            Downloads are emailed here and saved to your library.{' '}
            <Link href="/dashboard" className="text-brand-300 hover:underline">
              Manage account
            </Link>
          </p>
        </section>
      </div>

      {/* ---- summary ---- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">ORDER SUMMARY</h2>

          <ul className="space-y-3">
            {cart.items.map((it) => (
              <li key={`${it.beatId}-${it.license}`} className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                  {it.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-ink-900 text-[9px] font-black text-white/50">
                      BV
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-white">{it.title}</div>
                  <div className="text-[11px] text-brand-300">{it.licenseName}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-bold text-white">{money(it.price)}</span>
                  <button
                    onClick={() => cart.remove(it.beatId, it.license)}
                    className="text-white/25 transition hover:text-brand-400"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-white/[.07] pt-4 text-sm">
            <div className="flex justify-between text-white/50">
              <span>Subtotal</span>
              <span>{money(cart.total)}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Processing fee</span>
              <span className="text-brand-300">Free</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-white/[.07] pt-3">
              <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/40">
                Total
              </span>
              <span className="display text-3xl text-white">{money(cart.total)}</span>
            </div>
          </div>

          <button onClick={pay} disabled={loading} className="btn-red mt-6 w-full !py-4 text-sm">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Redirecting to payment…
              </>
            ) : (
              <>Pay {money(cart.total)} →</>
            )}
          </button>

          {demo && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[.07] p-3.5 text-[11px] leading-relaxed text-amber-200/80">
              <b className="text-amber-200">Demo mode.</b> No Paystack keys are configured yet, so
              you&apos;ll go through a simulated checkout. Add your keys in the producer dashboard
              (Settings) to take real Mobile Money and bank payments.
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[.14em] text-white/25">
            <span>🔒 Secure</span>
            <span>⚡ Instant delivery</span>
            <span>↩︎ 5 downloads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
