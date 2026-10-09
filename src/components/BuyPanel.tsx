'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LICENSES, type LicenseId } from '@/lib/utils';
import { useCart } from './CartProvider';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export default function BuyPanel({
  beat,
}: {
  beat: {
    id: number;
    slug: string;
    title: string;
    cover_url: string;
    price_basic: number;
    price_premium: number;
    price_exclusive: number;
    price_buyout: number;
    status: string;
  };
}) {
  const [license, setLicense] = useState<LicenseId>('basic');
  const cart = useCart();
  const money = useMoney();
  const toast = useToast();
  const router = useRouter();

  const priceOf = (k: LicenseId) =>
    Number(
      { basic: beat.price_basic, premium: beat.price_premium, exclusive: beat.price_exclusive, buyout: beat.price_buyout }[k],
    );

  const price = priceOf(license);
  const sold = beat.status === 'sold';

  function add(thenCheckout = false) {
    if (sold) return;
    cart.add({
      beatId: beat.id,
      slug: beat.slug,
      title: beat.title,
      cover: beat.cover_url,
      license,
      licenseName: LICENSES[license].name,
      price,
    });
    toast(`${beat.title} — ${LICENSES[license].name} added`);
    if (thenCheckout) setTimeout(() => router.push('/checkout'), 220);
  }

  return (
    <div className="rounded-3xl border border-white/[.08] bg-ink-850/70 p-5 backdrop-blur sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="display text-lg">CHOOSE YOUR LICENCE</h2>
        <span className="text-[11px] uppercase tracking-[.14em] text-white/35">4 options</span>
      </div>

      <div className="space-y-2.5">
        {(Object.keys(LICENSES) as LicenseId[]).map((k) => {
          const p = priceOf(k);
          const active = license === k;
          const disabled = !p;
          return (
            <button
              key={k}
              disabled={disabled}
              onClick={() => setLicense(k)}
              className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                disabled
                  ? 'cursor-not-allowed border-white/5 bg-white/[.01] opacity-40'
                  : active
                    ? 'border-brand-500/60 bg-brand-500/[.08] shadow-[0_0_40px_-18px_rgba(255,45,58,.8)]'
                    : 'border-white/[.08] bg-white/[.02] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
                      active ? 'border-brand-500' : 'border-white/25'
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-white">{LICENSES[k].name}</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-white/45">
                      {LICENSES[k].blurb}
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[15px] font-black ${
                    active ? 'text-brand-300' : 'text-white/80'
                  }`}
                >
                  {disabled ? '—' : money(p)}
                </span>
              </div>

              {active && (
                <ul className="mt-3.5 grid gap-1.5 border-t border-white/[.07] pt-3.5">
                  {LICENSES[k].details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-[12px] text-white/55">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-[.16em] text-white/35">Total</div>
          <div className="display text-3xl text-white">{money(price)}</div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-white/35">
          Instant delivery
          <br />
          by email
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={() => add(true)} disabled={sold} className="btn-red text-sm">
          {sold ? 'Sold out' : 'Buy now'}
        </button>
        <button onClick={() => add(false)} disabled={sold} className="btn-ghost text-sm">
          Add to cart
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/30">
        Pay with Mobile Money, bank transfer or card. Files are emailed the moment payment clears.
      </p>
    </div>
  );
}
