import Link from 'next/link';
import { notFound } from 'next/navigation';
import SimulateClient from './SimulateClient';
import { getOrderByRef } from '@/lib/queries';
import { paystackMode } from '@/lib/paystack';
import { getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Confirm payment — Project 1' };

export default function SimulatePage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  if (paystackMode() !== 'demo') notFound();

  const ref = searchParams.reference || '';
  const order = getOrderByRef(ref);
  if (!order) notFound();

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-950/50 text-2xl">
            💳
          </div>
          <h1 className="display text-[clamp(1.8rem,4.5vw,2.8rem)] text-white">
            CONFIRM <span className="text-brand-500">PAYMENT</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/45">
            This is the simulated Paystack screen used while no API keys are configured.
          </p>
        </div>

        <SimulateClient
          reference={ref}
          total={order.total}
          items={(order.items || []).map((i: any) => ({
            title: i.beat_title,
            license: i.license,
            price: i.price,
          }))}
          currencySymbol={getSetting('currency_symbol') || 'GH₵'}
          method={order.method}
        />

        <p className="mt-6 text-center text-[11px] text-white/25">
          <Link href="/beats" className="hover:text-white/60">
            ← Cancel and go back
          </Link>
        </p>
      </div>
    </div>
  );
}
