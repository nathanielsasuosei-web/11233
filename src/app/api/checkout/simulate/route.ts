import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { paystackMode } from '@/lib/paystack';
import { completeOrder } from '@/lib/complete';
import { absoluteUrl } from '@/lib/fulfill';

/**
 * Demo-mode payment confirmation. Only active while no Paystack keys are
 * configured, so it can never mark a real order as paid.
 */
export async function POST(req: Request) {
  if (paystackMode() !== 'demo') {
    return NextResponse.json(
      { error: 'Simulated checkout is disabled while Paystack keys are configured.' },
      { status: 403 },
    );
  }

  const { reference, channel } = (await req.json().catch(() => ({}))) as {
    reference?: string;
    channel?: string;
  };
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const order = get<any>('SELECT * FROM orders WHERE reference = ?', [reference]);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const result = await completeOrder(reference, (p) => absoluteUrl(req, p), {
    force: true,
    channel: channel || 'demo',
  });

  return NextResponse.json(result);
}
