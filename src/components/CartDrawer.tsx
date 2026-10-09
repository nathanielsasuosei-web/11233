'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { useMoney } from './SettingsProvider';

export default function CartDrawer() {
  const cart = useCart();
  const money = useMoney();

  return (
    <>
      <div
        onClick={() => cart.setOpen(false)}
        className={`fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          cart.open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[85] flex h-full w-[min(94vw,420px)] flex-col border-l border-white/[.08] bg-ink-850 transition-transform duration-500 ${
          cart.open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
          <div>
            <h2 className="display text-lg">YOUR CART</h2>
            <p className="text-[11px] uppercase tracking-[.16em] text-white/35">
              {cart.count} {cart.count === 1 ? 'licence' : 'licences'}
            </p>
          </div>
          <button
            onClick={() => cart.setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[.03] text-2xl">
                🎧
              </div>
              <p className="text-sm text-white/50">Your cart is empty.</p>
              <Link
                href="/beats"
                onClick={() => cart.setOpen(false)}
                className="btn-red mt-6 !px-6 !py-2.5 text-xs"
              >
                Browse beats
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.items.map((it) => (
                <li
                  key={`${it.beatId}-${it.license}`}
                  className="flex gap-3 rounded-2xl border border-white/[.07] bg-white/[.02] p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                    {it.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-700 to-ink-900 text-[9px] font-black text-white/60">
                        BV
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-white">{it.title}</div>
                    <div className="text-[11px] text-brand-300">{it.licenseName}</div>
                    <div className="mt-1 text-[13px] font-bold text-white">{money(it.price)}</div>
                  </div>
                  <button
                    onClick={() => cart.remove(it.beatId, it.license)}
                    className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-lg text-white/30 transition hover:bg-brand-500/15 hover:text-brand-300"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-white/[.07] p-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="display text-xl">{money(cart.total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => cart.setOpen(false)}
              className="btn-red w-full text-sm"
            >
              Checkout
            </Link>
            <button
              onClick={cart.clear}
              className="mt-3 w-full text-[11px] font-semibold uppercase tracking-[.14em] text-white/30 transition hover:text-white/70"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
