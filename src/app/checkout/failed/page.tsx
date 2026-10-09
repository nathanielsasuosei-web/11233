import Link from 'next/link';
import { getOrderByRef } from '@/lib/queries';
import { getSetting } from '@/lib/db';
import { formatMoney } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment not completed — Beatvault' };

export default function FailedPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const order = searchParams.reference ? getOrderByRef(searchParams.reference) : null;
  const symbol = getSetting('currency_symbol') || 'GH₵';

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-brand-500/25 bg-brand-950/50 text-2xl">
          ⚠️
        </div>
        <h1 className="display text-2xl text-white">Payment not completed</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/45">
          {order
            ? `Your order of ${formatMoney(order.total, symbol)} (${order.reference}) is still pending. Nothing has been charged — you can try again whenever you're ready.`
            : 'We could not confirm this payment. Nothing has been charged.'}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/checkout" className="btn-red !px-7 text-sm">
            Try again
          </Link>
          <Link href="/beats" className="btn-ghost !px-7 text-sm">
            Back to beats
          </Link>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-white/25">
          Paid but not seeing your files?{' '}
          <Link href="/contact" className="text-brand-300 hover:underline">
            Message the producer
          </Link>{' '}
          with your reference number.
        </p>
      </div>
    </div>
  );
}
